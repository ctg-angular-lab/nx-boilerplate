import { Route } from '@angular/router';
import { RemoteEntryComponent } from './remote-entry.component';
import { AppointmentLogicService } from '../services/appointment-logic.service';
import { ConfirmacionCitasService } from '../services/confirmacion-citas.service';

export const remoteRoutes: Route[] = [
  {
    path: '',
    component: RemoteEntryComponent,
    providers: [AppointmentLogicService, ConfirmacionCitasService],
  },
];
