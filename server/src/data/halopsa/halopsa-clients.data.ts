import { getHaloPsaApiUrl } from ':utils';
import { HaloPsaAuth } from ':data';
import { axiosHaloPsa } from ':app/axios-smart-retry.js';

export async function getAll() {
  const url = getHaloPsaApiUrl('/Client');
  const headers = await HaloPsaAuth.getHeaders();
  return (await axiosHaloPsa.get(url, { headers })).data.clients;
}
