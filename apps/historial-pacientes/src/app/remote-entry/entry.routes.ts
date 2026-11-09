import { Route } from '@angular/router';
import { RemoteEntryComponent } from './remote-entry.component';
import { HistorialPacientesService } from '../services/historial-pacientes.service';

export const remoteRoutes: Route[] = [
  {
    path: '',
    component: RemoteEntryComponent,
    providers: [HistorialPacientesService],
  },
];

