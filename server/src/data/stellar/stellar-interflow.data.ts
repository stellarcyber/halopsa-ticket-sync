import { 
  getAxios,
  getDataUrl,
  getStellarServer,
  makeStellarUrl
} from ':utils';
import { getHeaders } from './stellar-auth.data.js';

export async function getInterflow(stellarIndex: string, stellarId: string): Promise<any> {
  const server = getStellarServer();
  const { verifySSL, host } = server;
  const axios = getAxios(verifySSL);
  const url = getDataUrl(host, `${stellarIndex}/_search?q=_id:${stellarId}`);
  const headers = await getHeaders(server);
  const res = await axios.get(url, { headers });
  const hits = res.data.hits ?? {};
  if (hits?.total?.value) {
    const hit = hits.hits[0]._source ?? {};
    hit.stellar_url = makeStellarUrl(stellarIndex, stellarId);
    return hit;
  }
  return undefined;
}
