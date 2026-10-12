import { Component, ChangeDetectionStrategy, inject, effect, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmacionCitasService } from '../../services/confirmacion-citas.service';
import { AppointmentLogicService } from '../../services/appointment-logic.service';
import { AGENDADOR_TABS } from '../../models/booking.models';
import { FiltrosConfirmacionComponent } from './filtros-confirmacion/filtros-confirmacion.component';
import { TablaCitasComponent } from './tabla-citas/tabla-citas.component';

@Component({
  selector: 'app-confirmacion-citas',
  standalone: true,
  imports: [
    CommonModule,
    FiltrosConfirmacionComponent,
    TablaCitasComponent,
  ],
  templateUrl: './confirmacion-citas.component.html',
  styleUrl: './confirmacion-citas.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmacionCitasComponent {
  protected readonly confirmacionService = inject(ConfirmacionCitasService);
  protected readonly appointmentLogic = inject(AppointmentLogicService);

  constructor() {
    // Sincronizar el retorno a la pestaña para reiniciar la fecha al día de hoy
    effect(() => {
      const activeTab = this.appointmentLogic.activeTab();
      if (activeTab === AGENDADOR_TABS.PROFESSIONALS) {
        untracked(() => {
          this.confirmacionService.resetToToday();
        });
      }
    });
  }

  onStatusChange(event: { id: string; status: 'CONFIRMED' | 'CANCELLED' }): void {
    this.confirmacionService.updateAppointmentStatus(event.id, event.status).subscribe();
  }

  onTrackContact(appointmentId: string): void {
    this.confirmacionService.trackWhatsAppContact(appointmentId).subscribe();
  }
}
