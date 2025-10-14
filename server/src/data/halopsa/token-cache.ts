import { MS_IN_SECOND, THIRTY_SECONDS_IN_MS } from ':constants';
import { OauthResponseDTO } from ':dto/oauth.dto.js';

class TokenCache {
  private readonly cache = new Map<string, OauthResponseDTO & { timestamp: number }>();

  getResponse(cacheKey: string): OauthResponseDTO & { timestamp: number } | undefined {
    const cached = this.cache.get(cacheKey);
    if (!cached) {
      return undefined;
    }
    
    // Check if token expires within next 30 seconds
    const expiresAt = cached.timestamp + (cached.expires_in * MS_IN_SECOND) - THIRTY_SECONDS_IN_MS;
    if (Date.now() >= expiresAt) {
      this.cache.delete(cacheKey);
      return undefined;
    }
    
    return cached;
  }

  setToken(cacheKey: string, tokenResponse: OauthResponseDTO): void {
    this.cache.set(cacheKey, {
      ...tokenResponse,
      timestamp: Date.now()
    });
  }
}
export const tokenCache = new TokenCache();
