import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TimeSlot } from '@nx-boilerplate/api-interfaces';
import { AppointmentLogicService } from '../../services/appointment-logic.service';

@Component({
  selector: 'app-calendario-citas',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './calendario-citas.component.html',
  styleUrl: './calendario-citas.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarioCitasComponent {
  private readonly appointmentLogic = inject(AppointmentLogicService);

  readonly title = signal<string>('Calendario de Agendamiento');

  /**
   * Enlace reactivo directo con el Signal inmutable del servicio
   */
  readonly weekDays = this.appointmentLogic.weekDays;

  constructor() {
    this.appointmentLogic.loadMockWeekAvailability();
  }

  /**
   * Slot seleccionado actualmente
   */
  readonly selectedSlot = signal<TimeSlot | null>(null);

  /**
   * Rango de fechas computado a partir del primer y último día de la semana
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

    const monthName = lastDay.toLocaleDateString('es-ES', { month: 'long' });
    const year = lastDay.getFullYear();

    return `${startDay} - ${endDay} de ${monthName} de ${year}`;
  });

  goToToday(): void {
    console.log('Navegar a hoy');
  }

  previousWeek(): void {
    console.log('Semana anterior');
  }

  nextWeek(): void {
    console.log('Semana siguiente');
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

