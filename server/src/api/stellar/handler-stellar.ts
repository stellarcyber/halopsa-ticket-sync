import { StellarAuth } from ':data';
import { getStellarServer } from ':utils';

export async function testStellarServer(): Promise<void> {
  const server = getStellarServer();
  await StellarAuth.refreshAccessToken(server);
}
