import {
  getRouterInstance,
  log,
  stringToInt
} from ':utils';
import {
  HaloPsaAuth,
  HaloPsaClients,
  HaloPsaLookups,
  HaloPsaPriorities,
  HaloPsaTeams,
  HaloPsaTicketTypes,
  HaloPsaTickets
} from ':data';

export const $routes = getRouterInstance();

$routes.get(
  '/test-auth',
  async (_, res) => {
    try {
      await HaloPsaAuth.getAccessToken();
      res.send('OK');
    }
    catch {
      res.status(401).send('Unauthorized');
    }
  }
);

$routes.get(
  '/ticket-type',
  async (_, res) => {
    try {
      const ticketTypes = await HaloPsaTicketTypes.getAll();
      res.json(ticketTypes);
    }
    catch {
      res.status(401).send('Unauthorized');
    }
  }
);

$routes.get(
  '/client',
  async (_, res) => {
    try {
      const clients = await HaloPsaClients.getAll();
      res.json(clients);
    }
    catch {
      res.status(401).send('Unauthorized');
    }
  }
);

$routes.get(
  '/priority',
  async (_, res) => {
    try {
      const priorities = await HaloPsaPriorities.getAll();
      res.json(priorities);
    }
    catch {
      res.status(401).send('Unauthorized');
    }
  }
);

$routes.get(
  '/team',
  async (_, res) => {
    try {
      const teams = await HaloPsaTeams.getAll();
      res.json(teams);
    }
    catch {
      res.status(401).send('Unauthorized');
    }
  }
);

$routes.post(
  '/ticket',
  async (_, res) => {
    try {
      const ticketData = HaloPsaTickets.createTicketData({
        summary: `Sample case dated ${new Date().toUTCString()}`,
        details: 'This is a sample case'
      });
      const ticket = await HaloPsaTickets.createOne(ticketData);
      res.json(ticket);
    }
    catch (err: any) {
      log.error(err);
      res.status(401).send('Unauthorized');
    }
  }
);

$routes.get(
  '/ticket',
  async (_, res) => {
    try {
      const ticket = await HaloPsaTickets.getAll();
      res.json(ticket);
    }
    catch (err: any) {
      log.error(err);
      res.status(401).send('Unauthorized');
    }
  }
);

$routes.get(
  '/ticket/:id',
  async (req, res) => {
    const id = stringToInt(req.params.id);
    try {
      const ticket = await HaloPsaTickets.getById(id);
      res.json(ticket);
    }
    catch (err: any) {
      log.error(err);
      res.status(401).send('Unauthorized');
    }
  }
);

$routes.get(
  '/lookup',
  async (_, res) => {
    try {
      const lookups = await HaloPsaLookups.getAll();
      res.json(lookups);
    }
    catch (err: any) {
      log.error(err);
      res.status(401).send('Unauthorized');
    }
  }
);

$routes.get(
  '/lookup/urgency',
  async (_, res) => {
    try {
      const lookups = await HaloPsaLookups.getUrgency();
      res.json(lookups);
    }
    catch (err: any) {
      log.error(err);
      res.status(401).send('Unauthorized');
    }
  }
);

$routes.get(
  '/lookup/impact',
  async (_, res) => {
    try {
      const lookups = await HaloPsaLookups.getImpact();
      res.json(lookups);
    }
    catch (err: any) {
      log.error(err);
      res.status(401).send('Unauthorized');
    }
  }
);

$routes.post(
  '/actions',
  async (_, res) => {
    try {
      const lookups = await HaloPsaLookups.getImpact();
      res.json(lookups);
    }
    catch (err: any) {
      log.error(err);
      res.status(401).send('Unauthorized');
    }
  }
);
