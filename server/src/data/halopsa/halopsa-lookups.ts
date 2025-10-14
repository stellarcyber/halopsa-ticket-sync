import { getHaloPsaApiUrl } from ':utils';
import { HaloPsaAuth } from ':data';
import { axiosHaloPsa } from ':app/axios-smart-retry.js';
import { HALOPSA_LOOKUP_CODES } from ':constants';

export async function getAll() {
  const url = getHaloPsaApiUrl('/Lookup');
  const headers = await HaloPsaAuth.getHeaders();
  return (await axiosHaloPsa.get(url, { headers })).data;
}

export async function getByLookupId(id: number) {
  const url = getHaloPsaApiUrl(`/Lookup?lookupid=${id}`);
  const headers = await HaloPsaAuth.getHeaders();
  return (await axiosHaloPsa.get(url, { headers })).data;
}

export async function getUrgency() {
  return await getByLookupId(HALOPSA_LOOKUP_CODES.Urgency);
}

export async function getImpact() {
  return await getByLookupId(HALOPSA_LOOKUP_CODES.Impact);
}
