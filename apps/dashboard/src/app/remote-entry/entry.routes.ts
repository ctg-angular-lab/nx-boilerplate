import { Route } from '@angular/router';
import { provideNativeDateAdapter } from '@angular/material/core';
import { RemoteEntryComponent } from './remote-entry.component';
import { DashboardStateService } from '../services/dashboard-state.service';

export const remoteRoutes: Route[] = [
  {
    path: '',
    component: RemoteEntryComponent,
    providers: [provideNativeDateAdapter(), DashboardStateService],
  },
];

