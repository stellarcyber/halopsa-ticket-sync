import { MS_IN_SECOND } from ':constants';
import { StellarServerDTO } from ':dto';
import {
  assertIsNonNullable,
  getApiUrl,
  getAxios,
  log
} from ':utils';

class AuthTokenManager {
  keyTokenMap = new Map<string, string>(); // key to token
  keyTimeoutMap = new Map<string, NodeJS.Timeout>(); // key to timeout function
  keyFetcherPromiseMap = new Map<string, Promise<{ access_token: string,
    exp: number }>>();

  add(params: Pick<StellarServerDTO, 'user' | 'host'> & { accessToken: string,
    tokenExpirySeconds: number }): void {
    const FEWER_SECONDS_TO_WAIT = 30;
    const { accessToken, tokenExpirySeconds } = params;
    const key = getAuthTokenKey(params);
    this.keyTokenMap.set(key, accessToken);
    const existingTimeout = this.keyTimeoutMap.get(key);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      this.keyTimeoutMap.delete(key);
    }
    const now = new Date().getTime() / MS_IN_SECOND;
    const secondsToWait = tokenExpirySeconds - now - FEWER_SECONDS_TO_WAIT;
    const timeout = setTimeout(
      () => this.keyTokenMap.delete(key),
      secondsToWait * MS_IN_SECOND
    );
    this.keyTimeoutMap.set(key, timeout);
  }

  get(params: Pick<StellarServerDTO, 'user' | 'host'>): string | undefined {
    const key = getAuthTokenKey(params);
    return this.keyTokenMap.get(key);
  }

  addFetcherPromise(params: Pick<StellarServerDTO, 'user' | 'host'> & { promise: Promise<{ access_token: string,
    exp: number }> }): void {
    const { promise } = params;
    const key = getAuthTokenKey(params);
    this.keyFetcherPromiseMap.set(key, promise);
    promise.then(
      () => {
        this.keyFetcherPromiseMap.delete(key);
      }
    ).catch(
      (error) => log.error(error)
    );
  }

  getFetcherPromise(params: Pick<StellarServerDTO, 'user' | 'host'>): Promise<{ access_token: string,
    exp: number }> | undefined {
    const key = getAuthTokenKey(params);
    return this.keyFetcherPromiseMap.get(key);
  }
}
const tokenMgr = new AuthTokenManager();

export async function fetchAccessToken(server: StellarServerDTO): Promise<{ access_token: string,
  exp: number }> {
  const {
    host,
    user,
    apiKey,
    verifySSL 
  } = server;
  const url = getApiUrl(host, 'access_token');
  const axios = getAxios(verifySSL);
  return (await axios.post(
    url,
    null,
    {
      auth: {
        username: user,
        password: apiKey
      }
    }
  )).data;
}

export async function refreshAccessToken(params: StellarServerDTO): Promise<string> {
  const existingToken = tokenMgr.get(params);
  if (existingToken) {
    return existingToken;
  }
  let accessToken: string;
  let tokenExpirySeconds: number;
  /**
   * The below code handles a potential race condition where two auth requests
   * for the same user are simultaneously in flight.  Only the first request to
   * fetch an access token will fire.  Later in-flight requests will wait for
   * the first to finish and use its result
   */
  const existingFetcher = tokenMgr.getFetcherPromise(params);
  if (existingFetcher) {
    ({ access_token: accessToken, exp: tokenExpirySeconds } = await existingFetcher);
  }
  else {
    const promise = fetchAccessToken(params);
    tokenMgr.addFetcherPromise({
      ...params,
      promise
    });
    ({ access_token: accessToken, exp: tokenExpirySeconds } = await promise);
    tokenMgr.add({
      ...params,
      accessToken,
      tokenExpirySeconds
    });
  }
  return accessToken;
}

export async function getHeaders(params: StellarServerDTO) {
  const accessToken = await refreshAccessToken(params);
  return {
    Authorization: `Bearer ${accessToken}`
  };
}

export async function testConnection(server: StellarServerDTO): Promise<void> {
  const { access_token, exp } = await fetchAccessToken(server);
  assertIsNonNullable(access_token);
  assertIsNonNullable(exp);
}

function getAuthTokenKey(params: Pick<StellarServerDTO, 'user' | 'host'>): string {
  const { host, user } = params;
  return `${host}___${user}`;
}
