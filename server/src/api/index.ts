import { getRouterInstance } from ':utils';
import { $routes as $rootRoutes } from './root/index-root.js';
import { $routes as $halopsaRoutes } from './halopsa/index-halopsa.js';
import { $routes as $stellarRoutes } from './stellar/index-stellar.js';
import { $routes as $localdbRoutes } from './localdb/index-localdb.js';

export const $routes = getRouterInstance();
$routes.use('/', $rootRoutes);
$routes.use('/halopsa', $halopsaRoutes);
$routes.use('/stellar', $stellarRoutes);
$routes.use('/localdb', $localdbRoutes);
