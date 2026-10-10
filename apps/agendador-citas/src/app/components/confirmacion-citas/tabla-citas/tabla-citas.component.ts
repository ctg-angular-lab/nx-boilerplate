import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  viewChild,
  effect,
  afterNextRender,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { IAppointmentDashboard } from '@nx-boilerplate/api-interfaces';

@Component({
  selector: 'app-tabla-citas',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatBadgeModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './tabla-citas.component.html',
  styleUrl: './tabla-citas.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TablaCitasComponent {
  // Inputs con Signals
  readonly appointments = input.required<IAppointmentDashboard[]>();
  readonly isLoading = input<boolean>(false);

  // Outputs con Signals
  readonly statusChange = output<{ id: string; status: 'CONFIRMED' | 'CANCELLED' }>();
  readonly trackContact = output<string>();

  // MatPaginator Query Signal
  private readonly paginator = viewChild(MatPaginator);

  // Fuente de datos de Material
  readonly dataSource = new MatTableDataSource<IAppointmentDashboard>([]);

  readonly displayedColumns: string[] = [
    'paciente',
    'procedimiento',
    'hora',
    'contacto',
    'estado',
    'acciones',
  ];

  constructor() {
    // Sincronización de datos dentro de effect()
    effect(() => {
      this.dataSource.data = this.appointments();
    });

    afterNextRender(() => {
      const p = this.paginator();
      if (p) {
        this.dataSource.paginator = p;
      }
    });
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
      `Hola ${patientName}, te contactamos de la clínica para coordinar tu cita de ${cita.procedureName}. ¿Confirmas tu asistencia?`
    );
    const waUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${message}`
      : `https://api.whatsapp.com/send?text=${message}`;

    window.open(waUrl, '_blank');
    this.trackContact.emit(cita.appointmentId);
  }

  onConfirm(cita: IAppointmentDashboard): void {
    this.statusChange.emit({ id: cita.appointmentId, status: 'CONFIRMED' });
  }

  onCancel(cita: IAppointmentDashboard): void {
    this.statusChange.emit({ id: cita.appointmentId, status: 'CANCELLED' });
  }
}
