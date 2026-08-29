import { Route } from '@angular/router';
import { loadRemote } from '@module-federation/enhanced/runtime';

export const appRoutes: Route[] = [
  {
    path: 'Login',
    loadChildren: () =>
      loadRemote<typeof import('Login/Routes')>('Login/Routes').then(
        (m) => m!.remoteRoutes,
      ),
  },
  {
    path: 'Dashboard',
    loadChildren: () =>
      loadRemote<typeof import('Dashboard/Routes')>('Dashboard/Routes').then(
        (m) => m!.remoteRoutes,
      ),
  },
];
