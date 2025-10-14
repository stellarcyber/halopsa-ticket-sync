import 'source-map-support/register.js';
import 'reflect-metadata';
import Express from 'express';
import { $routes as $api } from ':api/index.js';
import * as http from 'http';
import { getConf, setConf } from ':config';
import { testStellarServer } from ':api/stellar/handler-stellar.js';
import {
  assertIsNonNullable,
  log,
  testNameOrId,
  testOrDie
} from ':utils';
import {
  HaloPsaAuth,
  HaloPsaClients,
  HaloPsaLookups,
  HaloPsaTeams,
  HaloPsaTicketTypes,
  StellarUser
} from ':data';
import * as CaseSync from './case-sync.js';

const { PORT } = getConf();

let server: http.Server | undefined;
process.on(
  'SIGTERM',
  async () => {
    log.info('Shutting down gracefully');
    server?.close();
    process.exit(0);
  }
);
process.on(
  'uncaughtException',
  (err: any) => {
    log.error(err);
  }
);
process.on(
  'unhandledRejection',
  (err: any) => {
    log.error(err);
  }
);

const app = Express();
app.use(Express.json({ limit: '1mb' }));
app.use('/api', $api);

export async function testHaloPsaTeamName(): Promise<void> {
  const { HALOPSA_TEAM_NAME } = getConf();
  if (!HALOPSA_TEAM_NAME) {
    return undefined;
  }
  const teams = await HaloPsaTeams.getAll();
  const team = teams.find(
    ({ name }: any) => name === HALOPSA_TEAM_NAME
  );
  await testOrDie(
    () => {
      assertIsNonNullable(team);
    },
    `HaloPSA team ${HALOPSA_TEAM_NAME} could not be found`
  );
  return undefined;
}

async function testHaloPsaTicketTypes(): Promise<void> {
  await testNameOrId(
    'HALOPSA_TICKET_TYPE_NAME',
    'HALOPSA_TICKET_TYPE_ID',
    async () => HaloPsaTicketTypes.getAll(),
    'ticket type id'
  );
}

async function testHaloPsaClients(): Promise<void> {
  await testNameOrId(
    'HALOPSA_CLIENT_NAME',
    'HALOPSA_CLIENT_ID',
    async () => HaloPsaClients.getAll(),
    'client name id'
  );
}

async function testHaloPsaImpact(): Promise<void> {
  await testNameOrId(
    'HALOPSA_IMPACT_NAME',
    'HALOPSA_IMPACT_ID',
    async () => HaloPsaLookups.getImpact(),
    'impact id'
  );
}

async function testHaloPsaUrgency(): Promise<void> {
  await testNameOrId(
    'HALOPSA_URGENCY_NAME',
    'HALOPSA_URGENCY_ID',
    async () => HaloPsaLookups.getUrgency(),
    'urgency id'
  );
}

async function main() {
  const { STELLAR_USER } = getConf();
  log.info('Testing Stellar DP connection');
  await testOrDie(testStellarServer, 'Connection to Stellar DP failed');
  log.info('Stellar DP connection successful');
  log.info('Testing HaloPSA connection');
  await testOrDie(HaloPsaAuth.getAccessToken, 'Connection to HaloPSA failed');
  log.info('HaloPSA connection successful');
  const user = await StellarUser.getUserByEmail(STELLAR_USER);
  setConf('STELLAR_USER_ID', user.user_id);
  await Promise.all([
    testHaloPsaTicketTypes(),
    testHaloPsaClients(),
    testHaloPsaTeamName(),
    testHaloPsaImpact(),
    testHaloPsaUrgency()
  ]);
  server = app.listen(
    PORT,
    () => {
      log.info(`Listening on port ${PORT}`);
    }
  );
  await CaseSync.sync();
}

await main();
