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
  {
    path: 'profesionales',
    loadChildren: () =>
      loadRemote<typeof import('lista-profesionales/Routes')>(
        'lista-profesionales/Routes'
      ).then((m) => m!.remoteRoutes),
  },
  {
    path: 'lista-profesionales',
    redirectTo: 'profesionales',
  },
  {
    path: 'procedimientos-medicos',
    loadChildren: () =>
      loadRemote<typeof import('procedimientos-medicos/Routes')>(
        'procedimientos-medicos/Routes'
      ).then((m) => m!.remoteRoutes),
  },
];

