import {
  Component,
  ChangeDetectionStrategy,
  inject,
  effect,
  untracked,
  viewChild,
  computed,
  TemplateRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DataTableComponent, TableColumnDef, TableActionDef } from '@nx-boilerplate/layouts';
import { IAppointmentDashboard } from '@nx-boilerplate/api-interfaces';
import { ConfirmacionCitasService } from '../../services/confirmacion-citas.service';
import { AppointmentLogicService } from '../../services/appointment-logic.service';
import { AGENDADOR_TABS } from '../../models/booking.models';
import { FiltrosConfirmacionComponent } from './filtros-confirmacion/filtros-confirmacion.component';

@Component({
  selector: 'app-confirmacion-citas',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatBadgeModule,
    MatTooltipModule,
    DataTableComponent,
    FiltrosConfirmacionComponent,
  ],
  templateUrl: './confirmacion-citas.component.html',
  styleUrl: './confirmacion-citas.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmacionCitasComponent {
  protected readonly confirmacionService = inject(ConfirmacionCitasService);
  protected readonly appointmentLogic = inject(AppointmentLogicService);

  // Queries para los templates de celda especializados
  private readonly pacienteTpl = viewChild.required<TemplateRef<{ $implicit: IAppointmentDashboard; field?: string }>>('pacienteTpl');
  private readonly procedimientoTpl = viewChild.required<TemplateRef<{ $implicit: IAppointmentDashboard; field?: string }>>('procedimientoTpl');
  private readonly horaTpl = viewChild.required<TemplateRef<{ $implicit: IAppointmentDashboard; field?: string }>>('horaTpl');
  private readonly whatsappTpl = viewChild.required<TemplateRef<{ $implicit: IAppointmentDashboard; field?: string }>>('whatsappTpl');
  private readonly estadoTpl = viewChild.required<TemplateRef<{ $implicit: IAppointmentDashboard; field?: string }>>('estadoTpl');

  // Configuración reactiva de columnas para lib-data-table
  readonly columns = computed<TableColumnDef<IAppointmentDashboard>[]>(() => [
    {
      field: 'paciente',
      header: 'Paciente',
      cellTemplate: this.pacienteTpl(),
    },
    {
      field: 'procedimiento',
      header: 'Procedimiento',
      cellTemplate: this.procedimientoTpl(),
    },
    {
      field: 'hora',
      header: 'Horario',
      cellTemplate: this.horaTpl(),
    },
    {
      field: 'contacto',
      header: 'WhatsApp',
      cellTemplate: this.whatsappTpl(),
    },
    {
      field: 'estado',
      header: 'Estado',
      cellTemplate: this.estadoTpl(),
    },
  ]);

  // Acciones nativas delegadas al componente reusable lib-data-table
  readonly tableActions: TableActionDef<IAppointmentDashboard>[] = [
    {
      id: 'confirm',
      icon: 'check_circle',
      label: 'Confirmar Cita',
      color: 'primary',
      disabled: (row) => row.status === 'CONFIRMED',
    },
    {
      id: 'cancel',
      icon: 'cancel',
      label: 'Cancelar Cita',
      color: 'warn',
      disabled: (row) => row.status === 'CANCELLED',
    },
  ];

  constructor() {
    // Sincronizar el retorno a la pestaña para reiniciar la fecha al día de hoy
    effect(() => {
      const activeTab = this.appointmentLogic.activeTab();
      if (activeTab === AGENDADOR_TABS.CONFIRMATION) {
        untracked(() => {
          this.confirmacionService.resetToToday();
        });
      }
    });
  }

  onTableAction(event: { action: string; row: IAppointmentDashboard }): void {
    if (event.action === 'confirm') {
      this.onStatusChange({ id: event.row.appointmentId, status: 'CONFIRMED' });
    } else if (event.action === 'cancel') {
      this.onStatusChange({ id: event.row.appointmentId, status: 'CANCELLED' });
    }
  }

  formatHour(isoOrDate: string | Date): string {
    const d = new Date(isoOrDate);
    if (isNaN(d.getTime())) return '';
    const hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const period = hours >= 12 ? 'p.m.' : 'a.m.';
    const displayHours = hours % 12 === 0 ? 12 : hours % 12;
    return `${displayHours}:${minutes} ${period}`;
  }

  onWhatsAppClick(cita: IAppointmentDashboard): void {
    const rawPhone = (cita.patientPhone || '').replace(/\D/g, '');
    const cleanPhone = rawPhone.length === 10 ? `57${rawPhone}` : rawPhone;
    const patientName = cita.patientFullName || 'Estimado paciente';
    const message = encodeURIComponent(
      `Hola ${patientName}, te contactamos del consultorio Dras. Botero para confirmar tu cita de ${cita.procedureName}. ¿Confirmas tu asistencia?`
    );
    const waUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${message}`
      : `https://api.whatsapp.com/send?text=${message}`;

    window.open(waUrl, '_blank');
    this.onTrackContact(cita.appointmentId);
  }

  onStatusChange(event: { id: string; status: 'CONFIRMED' | 'CANCELLED' }): void {
    this.confirmacionService.updateAppointmentStatus(event.id, event.status).subscribe();
  }

  onTrackContact(appointmentId: string): void {
    this.confirmacionService.trackWhatsAppContact(appointmentId).subscribe();
  }
}
