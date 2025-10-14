import { getConf } from ':config';
import { OauthResponseDTO } from ':dto/oauth.dto.js';
import { validateDto } from ':utils';
import * as oauth from 'oauth4webapi';
import { tokenCache } from './token-cache.js';

const CACHE_KEY = 'halopsa';

const {
  HALOPSA_AUTHORIZATION_SERVER_URL,
  HALOPSA_OIDC_CLIENT_ID,
  HALOPSA_OIDC_CLIENT_SECRET,
  HALOPSA_OIDC_CLIENT_SCOPE
} = getConf();
const issuer = new URL(HALOPSA_AUTHORIZATION_SERVER_URL);
const discoveryRes = await oauth.discoveryRequest(issuer, { algorithm: 'oidc' });
const authorizationServer = await oauth.processDiscoveryResponse(issuer, discoveryRes);
const client: oauth.Client = { client_id: HALOPSA_OIDC_CLIENT_ID };
const clientAuth = oauth.ClientSecretPost(HALOPSA_OIDC_CLIENT_SECRET);

// Client Credentials Grant Request & Response
export async function getAccessToken(): Promise<string> {
  const cachedRes = tokenCache.getResponse(CACHE_KEY);
  if (cachedRes) {
    return cachedRes.access_token;
  }
  const parameters = new URLSearchParams();
  parameters.set('scope', HALOPSA_OIDC_CLIENT_SCOPE);
  const response = await oauth.clientCredentialsGrantRequest(authorizationServer, client, clientAuth, parameters);
  const res = await oauth.processClientCredentialsResponse(authorizationServer, client, response);
  const validated = await validateDto(OauthResponseDTO, res);
  tokenCache.setToken(CACHE_KEY, validated);
  const { access_token } = validated;
  return access_token;
}

export async function getHeaders() {
  const accessToken = await getAccessToken();
  return {
    Authorization: `Bearer ${accessToken}`
  };
}
