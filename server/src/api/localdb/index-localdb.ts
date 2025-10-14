import { getRouterInstance, log } from ':utils';
import { LocalCheckpoint, LocalTickets } from ':data';

export const $routes = getRouterInstance();
const testData = {
  stellarCaseId: 'abcd',
  stellarCaseNumber: 1,
  remoteTicketId: 5,
  stellarTenantId: 'test',
  stellarLastModified: new Date().getTime(),
  remoteTicketLastModified: new Date().getTime()
};

$routes.post(
  '/ticket-linkage',
  async (_, res) => {
    try {
      await LocalTickets.insertTicketLinkage(testData);
      res.status(200).send('OK');
    }
    catch (err: any) {
      log.error(err);
      res.status(400).send(err);
    }
  }
);

$routes.get(
  '/ticket-linkage',
  async (_, res) => {
    try {
      const result = await LocalTickets.getTicketLinkageByStellarCaseId(testData.stellarCaseId);
      res.json(result);
    }
    catch (err: any) {
      log.error(err);
      res.status(400).send(err);
    }
  }
);

$routes.get(
  '/ticket-linkage/all',
  async (_, res) => {
    try {
      const result = await LocalTickets.getTickets();
      res.json(result);
    }
    catch (err: any) {
      log.error(err);
      res.status(400).send(err);
    }
  }
);

$routes.delete(
  '/ticket-linkage/all',
  async (_, res) => {
    try {
      const result = await LocalTickets.deleteAll();
      res.json(result);
    }
    catch (err: any) {
      log.error(err);
      res.status(400).send(err);
    }
  }
);

$routes.get(
  '/ticket-linkage/open',
  async (_, res) => {
    try {
      const result = await LocalTickets.getOpenTickets();
      res.json(result);
    }
    catch (err: any) {
      log.error(err);
      res.status(400).send(err);
    }
  }
);

$routes.post(
  '/ticket-linkage/close',
  async (_, res) => {
    try {
      await LocalTickets.closeTicketLinkage(testData.stellarCaseId);
      res.status(200).send('OK');
    }
    catch (err: any) {
      log.error(err);
      res.status(400).send(err);
    }
  }
);

$routes.post(
  '/ticket-linkage/update-remote-ticket-timestamp',
  async (_, res) => {
    try {
      await LocalTickets.updateRemoteTicketTimestamp({
        stellarCaseId: testData.stellarCaseId
      });
      res.status(200).send('OK');
    }
    catch (err: any) {
      log.error(err);
      res.status(400).send(err);
    }
  }
);

$routes.get(
  '/checkpoint',
  async (_, res) => {
    try {
      const checkpoint = await LocalCheckpoint.get();
      res.json({ checkpoint: checkpoint ?? null });
    }
    catch (err: any) {
      log.error(err);
      res.status(400).send(err);
    }
  }
);

$routes.post(
  '/checkpoint',
  async (_, res) => {
    try {
      await LocalCheckpoint.update();
      res.status(200).send('Ok');
    }
    catch (err: any) {
      log.error(err);
      res.status(400).send(err);
    }
  }
);

$routes.delete(
  '/checkpoint',
  async (_, res) => {
    try {
      await LocalCheckpoint.remove();
      res.status(200).send('Ok');
    }
    catch (err: any) {
      log.error(err);
      res.status(400).send(err);
    }
  }
);
