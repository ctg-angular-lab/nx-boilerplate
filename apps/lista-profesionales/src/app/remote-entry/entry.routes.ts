import { Route } from '@angular/router';
import { RemoteEntryComponent } from './remote-entry.component';
import { ProfesionalesAdminService } from '../services/profesionales-admin.service';

export const remoteRoutes: Route[] = [
  {
    path: '',
    component: RemoteEntryComponent,
    providers: [ProfesionalesAdminService],
  },
];
