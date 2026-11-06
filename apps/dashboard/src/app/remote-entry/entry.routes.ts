import { Route } from '@angular/router';
import { provideNativeDateAdapter } from '@angular/material/core';
import { RemoteEntryComponent } from './remote-entry.component';

export const remoteRoutes: Route[] = [
  {
    path: '',
    component: RemoteEntryComponent,
    providers: [provideNativeDateAdapter()],
  },
];

