import {
  assertIsNonNullable,
  getApiUrl,
  getAxios,
  getStellarServer
} from ':utils';
import { getHeaders } from './stellar-auth.data.js';

export async function getUsers(): Promise<any> {
  const server = getStellarServer();
  const { verifySSL, host } = server;
  const url = getApiUrl(host, '/users');
  const axios = getAxios(verifySSL);
  const headers = await getHeaders(server);
  const res = (await axios.get(url, { headers })).data;
  return res.data ?? [];
}

export async function getUserByEmail(email: string): Promise<any> {
  const users = await getUsers();
  const user = users.find(
    (u: any) => u.email === email
  );
  assertIsNonNullable(user);
  return user;
}
