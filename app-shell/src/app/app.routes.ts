import { Route } from '@angular/router';
import { loadRemote } from '@module-federation/enhanced/runtime';

export const appRoutes: Route[] = [
  {
    path: '',
    redirectTo: 'agendador-citas',
    pathMatch: 'full',
  },
  {
    path: 'agendador-citas',
    loadChildren: () =>
      loadRemote<typeof import('agendador-citas/Routes')>(
        'agendador-citas/Routes'
      ).then((m) => m!.remoteRoutes),
  },
  {
    path: 'dashboard',
    redirectTo: 'agendador-citas',
  },
  {
    path: 'login',
    loadChildren: () =>
      loadRemote<typeof import('Login/Routes')>('Login/Routes').then(
        (m) => m!.remoteRoutes,
      ),
  },
  {
    path: 'Login',
    redirectTo: 'login',
  },
];
