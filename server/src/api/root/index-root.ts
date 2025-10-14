import { getProperties, getSchema } from ':config';
import { getRouterInstance } from ':utils';

export const $routes = getRouterInstance();

$routes.get(
  '/ping',
  (_, res) => res.setHeader('content-type', 'text/plain').send('pong')
);

$routes.get(
  '/config',
  (_, res) => res.send(getProperties())
);

$routes.get(
  '/config-schema',
  (_, res) => res.send(getSchema())
);
