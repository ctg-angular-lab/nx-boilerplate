import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  inject,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { TimeSlot } from '@nx-boilerplate/api-interfaces';
import { AppointmentLogicService } from '../../services/appointment-logic.service';

@Component({
  selector: 'app-calendario-citas',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
  ],
  templateUrl: './calendario-citas.component.html',
  styleUrl: './calendario-citas.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarioCitasComponent {
  private readonly appointmentLogic = inject(AppointmentLogicService);

  readonly baseTitle = signal<string>('Calendario');

  /**
   * Catálogo de profesionales disponibles y profesional activo en el calendario
   */
  readonly activeProfessional = this.appointmentLogic.activeProfessional;
  readonly availableProfessionals = this.appointmentLogic.availableProfessionals;

  /**
   * Título compuesto que reactivamente incluye el nombre del profesional activo
   */
  readonly calendarTitle = computed(() => {
    const professional = this.appointmentLogic.activeProfessional();
    if (!professional) {
      return `${this.baseTitle()} de Agendamiento`;
    }
    return `${this.baseTitle()} — ${professional.nombres} ${professional.apellidos}`;
  });

  /**
   * Maneja el cambio de profesional desde la cabecera de filtros
   */
  onProfessionalChange(cedula: string): void {
    this.appointmentLogic.selectProfessionalByCedula(cedula);
    this.selectedSlot.set(null);
  }

  /**
   * Offset de semana respecto a la semana actual de Colombia (0 = actual, 1 = próxima, ...)
   */
  readonly selectedWeekOffset = signal<number>(0);

  /**
   * Indica si la vista actual corresponde a la semana actual (impide ir al pasado)
   */
  readonly isCurrentWeek = computed(() => this.selectedWeekOffset() === 0);

  /**
   * Enlace reactivo directo con el Signal inmutable del servicio
   */
  readonly weekDays = this.appointmentLogic.weekDays;

  /**
   * Slot seleccionado actualmente
   */
  readonly selectedSlot = signal<TimeSlot | null>(null);

  /**
   * Rango de fechas computado a partir del primer y último día de la semana visualizada
   */
  readonly currentDateRange = computed(() => {
    const days = this.weekDays();
    if (!days || days.length === 0) {
      return '';
    }

    const firstDay = days[0].date;
    const lastDay = days[days.length - 1].date;

    const startDay = firstDay.getDate();
    const endDay = lastDay.getDate();

    const startMonth = firstDay.toLocaleDateString('es-ES', { month: 'short' });
    const endMonth = lastDay.toLocaleDateString('es-ES', { month: 'long' });
    const year = lastDay.getFullYear();

    if (firstDay.getMonth() === lastDay.getMonth()) {
      return `${startDay} - ${endDay} de ${endMonth} de ${year}`;
    }

    return `${startDay} ${startMonth} - ${endDay} ${endMonth} de ${year}`;
  });

  constructor() {
    // Sincroniza la disponibilidad cada vez que cambia la semana visualizada
    effect(() => {
      const offset = this.selectedWeekOffset();
      this.appointmentLogic.loadMockWeekAvailability(offset);
    });
  }

  /**
   * Regresa inmediatamente a la semana actual de Colombia
   */
  goToToday(): void {
    if (!this.isCurrentWeek()) {
      this.selectedWeekOffset.set(0);
      this.selectedSlot.set(null);
    }
  }

  /**
   * Retrocede una semana (bloqueado si ya está en la semana actual)
   */
  previousWeek(): void {
    if (this.selectedWeekOffset() > 0) {
      this.selectedWeekOffset.update((offset) => offset - 1);
      this.selectedSlot.set(null);
    }
  }

  /**
   * Avanza a la semana siguiente
   */
  nextWeek(): void {
    this.selectedWeekOffset.update((offset) => offset + 1);
    this.selectedSlot.set(null);
  }

  /**
   * Maneja la selección / deselección de un slot disponible
   */
  onSlotClick(slot: TimeSlot): void {
    if (slot.status === 'reservado') {
      return;
    }
    this.selectedSlot.set(this.selectedSlot()?.id === slot.id ? null : slot);
  }

  /**
   * Verifica si el slot dado está actualmente seleccionado
   */
  isSlotSelected(slot: TimeSlot): boolean {
    return this.selectedSlot()?.id === slot.id;
  }
}
