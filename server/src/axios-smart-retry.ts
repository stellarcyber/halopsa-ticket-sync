import { MS_IN_SECOND, RATE_LIMIT_RESPONSE_CODE } from ':constants';
import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig
} from 'axios';

interface RateLimitedAxiosConfig extends AxiosRequestConfig {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
}

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _isProbe?: boolean;
}

export class RateLimitedAxios {
  private readonly client: AxiosInstance;
  private isRateLimited = false;
  private isRetrying = false;
  private retryPromise: Promise<void> | null = null;
  private readonly pendingRequests: (() => void)[] = [];
  private readonly maxRetries;
  private readonly baseDelay;
  private readonly maxDelay;
  private retryCount = 0;
  
  constructor(config: RateLimitedAxiosConfig = {}) {
    const {
      maxRetries = 5,
      baseDelay = 1000,
      maxDelay = 60000,
      ...axiosConfig
    } = config;
    
    this.client = axios.create(axiosConfig);
    this.maxRetries = maxRetries;
    this.baseDelay = baseDelay;
    this.maxDelay = maxDelay;
    
    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to queue requests when rate limited
    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        const customConfig = config as CustomAxiosRequestConfig;
        
        // Probe requests bypass the rate limit check
        if (customConfig._isProbe) {
          return config;
        }
        
        if (this.isRateLimited) {
          console.log(`Request queued due to rate limit: ${config.method?.toUpperCase()} ${config.url}`);
          // Wait until rate limit is cleared
          await this.waitForRateLimitClear();
          console.log(`Request released from queue: ${config.method?.toUpperCase()} ${config.url}`);
        }
        return config;
      },
      async (error) => Promise.reject(error)
    );

    // Response interceptor to handle 429 responses
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error) => {
        const config = error.config as CustomAxiosRequestConfig;
        
        // Check if it's a 429 error
        if (error.response?.status === RATE_LIMIT_RESPONSE_CODE) {
          console.log({ headers: error.response?.headers })
          // Mark as rate limited immediately
          this.isRateLimited = true;
          
          // Extract Retry-After header if present
          const retryAfter = error.response.headers['retry-after'] as string | undefined;
          
          // If we're already retrying, just wait for that retry to complete
          if (this.isRetrying) {
            console.log('Rate limited, but retry already in progress. Waiting...');
            await this.retryPromise;
            // After the retry completes, re-attempt this request
            return this.client.request(config);
          }
          
          // We're the first 429, so we handle the retry
          if (this.retryCount >= this.maxRetries && !retryAfter) {
            return Promise.reject(new Error(`Max retries (${this.maxRetries}) exceeded for rate-limited request`));
          }
          
          this.isRetrying = true;
          
          // Create a promise that others can wait on
          this.retryPromise = this.performRetry(retryAfter);
          
          await this.retryPromise;
          // Success! Try this request again
          return this.client.request(config);
        }
        else if (this.isRateLimited) {
          // Non-429 error while rate limited - wait for rate limit to clear before failing
          console.log(`Non-429 error (${error.response?.status || error.code}) while rate limited. Waiting for rate limit to clear...`);
          await this.waitForRateLimitClear();
          // After rate limit clears, don't retry - just reject with the original error
          return Promise.reject(error);
        }
        
        return Promise.reject(error);
      }
    );
  }

  // eslint-disable-next-line max-statements, complexity
  private async performRetry(retryAfter: string | null = null) {
    // If we have a Retry-After header, use it directly
    if (retryAfter !== null) {
      const delay = this.parseRetryAfter(retryAfter);
      console.log(`Rate limited. Retry-After header indicates ${delay}ms wait.`);
      await this.sleep(delay);
      
      // After waiting the specified time, probe once
      try {
        await this.client.head(this.client.defaults.baseURL || '/', { 
          timeout: 5000,
          _isProbe: true
        } as CustomAxiosRequestConfig);
        
        console.log('Rate limit cleared after Retry-After wait!');
        this.clearRateLimitState();
        return;
      }
      catch (error: any) {
        if (error.response?.status === RATE_LIMIT_RESPONSE_CODE) {
          // Still rate limited, fall back to exponential backoff
          console.log('Still rate limited after Retry-After wait, falling back to exponential backoff');
        }
        else if (error.config?._isProbe && (error.code === 'ECONNABORTED' || error.response?.status === 404)) {
          console.log('Probe request failed, assuming rate limit cleared');
          this.clearRateLimitState();
          return;
        }
        else {
          throw error;
        }
      }
    }
    
    // Exponential backoff loop
    while (this.retryCount < this.maxRetries) {
      // Calculate exponential backoff delay
      const delay = Math.min(
        this.baseDelay * Math.pow(2, this.retryCount),
        this.maxDelay
      );
      
      console.log(`Rate limited. Waiting ${delay}ms before probe retry (attempt ${this.retryCount + 1}/${this.maxRetries})`);
      
      await this.sleep(delay);
      this.retryCount++;
      
      // Make a lightweight probe request to check if rate limit is cleared
      try {
        await this.client.head(this.client.defaults.baseURL || '/', { 
          timeout: 5000,
          _isProbe: true
        } as CustomAxiosRequestConfig);
        
        // Success! Rate limit is cleared
        console.log('Rate limit cleared!');
        this.clearRateLimitState();
        return;
      }
      catch (error: any) {
        if (error.response?.status === RATE_LIMIT_RESPONSE_CODE) {
          // Still rate limited, continue loop
          continue;
        }
        else if (error.config?._isProbe && (error.code === 'ECONNABORTED' || error.response?.status === 404)) {
          // Probe failed for other reasons (timeout, 404), but assume rate limit might be clear
          console.log('Probe request failed, assuming rate limit cleared');
          this.clearRateLimitState();
          return;
        }
        else {
          // Other error, propagate
          throw error;
        }
      }
    }
    
    // Max retries exceeded
    this.isRetrying = false;
    this.retryPromise = null;
    throw new Error(`Max retries (${this.maxRetries}) exceeded for rate limit recovery`);
  }

  private async waitForRateLimitClear() {
    return new Promise<void>((resolve) => {
      this.pendingRequests.push(resolve);
    });
  }

  private clearRateLimitState() {
    console.log('Clearing rate limit state...');
    this.isRateLimited = false;
    this.isRetrying = false;
    this.retryCount = 0;
    this.retryPromise = null;
    this.resolvePendingRequests();
  }

  private resolvePendingRequests() {
    const count = this.pendingRequests.length;
    console.log(`Rate limit cleared. Releasing ${count} pending requests`);
    
    // Resolve all pending requests
    const requests = [...this.pendingRequests];
    this.pendingRequests.length = 0;
    
    requests.forEach(resolve => resolve());
  }

  private async sleep(ms: number) {
    return new Promise<void>(resolve => setTimeout(resolve, ms));
  }

  private parseRetryAfter(retryAfter: string) {
    // Retry-After can be either:
    // 1. A number of seconds (integer)
    // 2. An HTTP date string
    
    // Try parsing as integer (seconds)
    const seconds = parseInt(retryAfter, 10);
    if (!isNaN(seconds)) {
      return seconds * MS_IN_SECOND; // Convert to milliseconds
    }
    
    // Try parsing as HTTP date
    try {
      const retryDate = new Date(retryAfter);
      const now = new Date();
      const diff = retryDate.getTime() - now.getTime();
      
      // If the date is in the future, use it
      if (diff > 0) {
        return diff;
      }
    }
    catch (e) {
      // Invalid date format
    }
    
    // Fallback to base delay if we can't parse
    console.warn(`Could not parse Retry-After header: ${retryAfter}, using base delay`);
    return this.baseDelay;
  }

  // Expose standard axios methods
  public async get<T = any>(url: string, config?: AxiosRequestConfig) {
    return this.client.get<T>(url, config);
  }

  public async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.client.post<T>(url, data, config);
  }

  public async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.client.put<T>(url, data, config);
  }

  public async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.client.patch<T>(url, data, config);
  }

  public async delete<T = any>(url: string, config?: AxiosRequestConfig) {
    return this.client.delete<T>(url, config);
  }

  public async request<T = any>(config: AxiosRequestConfig) {
    return this.client.request<T>(config);
  }

  /**
   * Waits for any active rate limiting to be cleared.
   * Resolves immediately if not currently rate limited.
   * Useful for callers who want to wait before making requests.
   */
  public async waitForRateLimit() {
    if (!this.isRateLimited) {
      return;
    }
    await this.waitForRateLimitClear();
  }
}

// Usage example:
// const api = new RateLimitedAxios({
//   baseURL: 'https://api.example.com',
//   maxRetries: 5,
//   baseDelay: 1000, // Start with 1 second
//   maxDelay: 60000 // Cap at 60 seconds
// });

export const axiosHaloPsa = new RateLimitedAxios();

// All requests will automatically handle rate limiting
// Even if multiple requests get 429 at once, only one retry cycle runs
// api.get('/endpoint1');
// api.post('/endpoint2', { data: 'value' });
// api.get('/endpoint3');

// export default RateLimitedAxios;
