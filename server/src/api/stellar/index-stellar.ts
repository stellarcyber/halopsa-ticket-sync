import { getRouterInstance } from ':utils';
import { testStellarServer } from './handler-stellar.js';
import { StellarCase, StellarUser } from ':data';

export const $routes = getRouterInstance();

$routes.get(
  '/test-auth',
  async (_, res) => {
    try {
      await testStellarServer();
      res.send('OK');
    }
    catch {
      res.status(401).send('Unauthorized');
    }
  }
);

$routes.get(
  '/user',
  async (_, res) => {
    try {
      const users = await StellarUser.getUsers();
      res.json(users);
    }
    catch (err: any) {
      res.status(400).send(err);
    }
  }
);

$routes.get(
  '/user/:email',
  async (req, res) => {
    const { email } = req.params;
    try {
      const users = await StellarUser.getUserByEmail(email);
      res.json(users);
    }
    catch (err: any) {
      res.status(400).send(err);
    }
  }
);

$routes.get(
  '/case',
  async (_, res) => {
    try {
      const cases = await StellarCase.getAll();
      res.json(cases);
    }
    catch (err: any) {
      res.status(400).send(err);
    }
  }
);

$routes.get(
  '/case/:id/summary',
  async (req, res) => {
    try {
      const { id } = req.params;
      const summary = await StellarCase.getSummary(id);
      res.json(summary);
    }
    catch (err: any) {
      res.status(400).send(err);
    }
  }
);

$routes.get(
  '/case/:id/observables',
  async (req, res) => {
    try {
      const { id } = req.params;
      const observables = await StellarCase.getObservables(id);
      res.json(observables);
    }
    catch (err: any) {
      res.status(400).send(err);
    }
  }
);

$routes.get(
  '/case/:id/alerts',
  async (req, res) => {
    try {
      const { id } = req.params;
      const observables = await StellarCase.getAlerts({ caseId: id });
      res.json(observables);
    }
    catch (err: any) {
      res.status(400).send(err);
    }
  }
);

$routes.get(
  '/case/:id/comments',
  async (req, res) => {
    try {
      const { id } = req.params;
      const comments = await StellarCase.getComments(id);
      res.json(comments);
    }
    catch (err: any) {
      res.status(400).send(err);
    }
  }
);
