import { Route } from '@angular/router';
import { RemoteEntryComponent } from './remote-entry.component';
import { ProcedimientosAdminService } from '../services/procedimientos-admin.service';

export const remoteRoutes: Route[] = [
  {
    path: '',
    component: RemoteEntryComponent,
    providers: [ProcedimientosAdminService],
  },
];
