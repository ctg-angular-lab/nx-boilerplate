import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  IDashboardDoctor,
  IDashboardDoctorCell,
  IDashboardTimeRow,
} from '../../models/dashboard.models';
import { timeStringToMinutes } from '../../utils/dashboard-calendar.mapper';

@Component({
  selector: 'app-daily-cascade-calendar',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './daily-cascade-calendar.component.html',
  styleUrl: './daily-cascade-calendar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DailyCascadeCalendarComponent {
  readonly #destroyRef = inject(DestroyRef);
  readonly #now = signal<Date>(new Date());

  /** Fecha activa en visualización */
  readonly selectedDate = input.required<Date>();

  /** Título dinámico que integra el día activo (ej. "Calendario — Viernes, 6 de noviembre") */
  readonly calendarTitle = computed<string>(() => {
    const date = this.selectedDate();
    if (!date) return 'Calendario';
    const weekday = new Intl.DateTimeFormat('es-CO', { weekday: 'long' }).format(date);
    const capitalizedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
    const day = date.getDate();
    const month = new Intl.DateTimeFormat('es-CO', { month: 'long' }).format(date);
    return `Calendario — ${capitalizedWeekday}, ${day} de ${month}`;
  });

  /** Filas de la grilla horaria proyectadas a 30 min con las capas apiladas */
  readonly timeGridRows = input.required<readonly IDashboardTimeRow[]>();

  /** Médicos activos visibles en la superposición (capa 0 a 3) */
  readonly overlayDoctors = input.required<readonly IDashboardDoctor[]>();

  /** Notifica navegación de días (-1 o +1) */
  readonly navigateDay = output<number>();

  /** Notifica retorno a la fecha de hoy */
  readonly goToToday = output<void>();

  /** Hook preparado para la Etapa 2 (clic en un slot de un médico específico) */
  readonly slotClick = output<IDashboardDoctorCell>();

  /** Minutos transcurridos del día actual */
  readonly currentMinutes = computed<number>(() => {
    const now = this.#now();
    return now.getHours() * 60 + now.getMinutes();
  });

  /** Comparación de día entre selectedDate y hoy: -1 (pasado), 0 (hoy), 1 (futuro) */
  readonly selectedDayComparison = computed<-1 | 0 | 1>(() => {
    const selected = this.selectedDate();
    const now = this.#now();
    const selectedMidnight = new Date(
      selected.getFullYear(),
      selected.getMonth(),
      selected.getDate(),
      0,
      0,
      0,
      0
    ).getTime();
    const todayMidnight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0
    ).getTime();

    if (selectedMidnight < todayMidnight) return -1;
    if (selectedMidnight > todayMidnight) return 1;
    return 0;
  });

  /** Etiqueta legible HH:mm de la hora actual */
  readonly currentTimeLabel = computed<string>(() => {
    const now = this.#now();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  });

  /** Rango del horario laboral del médico activo en minutos */
  readonly workingHoursRange = computed<{ start: number; end: number }>(() => {
    const primaryDoctor = this.overlayDoctors()[0];
    const startStr = primaryDoctor?.horarioTrabajo?.horaInicio || '08:00';
    const endStr = primaryDoctor?.horarioTrabajo?.horaFin || '18:00';
    return {
      start: timeStringToMinutes(startStr),
      end: timeStringToMinutes(endStr),
    };
  });

  constructor() {
    const intervalId = setInterval(() => {
      this.#now.set(new Date());
    }, 60_000);

    this.#destroyRef.onDestroy(() => clearInterval(intervalId));
  }

  /**
   * Determina si la hora actual se encuentra dentro del horario laboral
   * y pertenece al intervalo de 30 minutos de la fila dada.
   */
  isCurrentTimeInRow(row: IDashboardTimeRow): boolean {
    const current = this.currentMinutes();
    const { start, end } = this.workingHoursRange();

    if (current < start || current > end) {
      return false;
    }

    const primaryLayer = row.layers[0];
    if (primaryLayer && primaryLayer.status === 'OUT_OF_HOURS') {
      return false;
    }

    return current >= row.startMinutes && current < row.endMinutes;
  }

  /**
   * Calcula la posición vertical porcentual (0% - 100%) de la línea de hora actual dentro de la fila de 30 minutos.
   */
  getCurrentTimeOffsetPercent(row: IDashboardTimeRow): number {
    const offsetMinutes = this.currentMinutes() - row.startMinutes;
    const clamped = Math.max(0, Math.min(30, offsetMinutes));
    return (clamped / 30) * 100;
  }

  onPrevDay(): void {
    this.navigateDay.emit(-1);
  }

  onNextDay(): void {
    this.navigateDay.emit(1);
  }

  onToday(): void {
    this.goToToday.emit();
  }

  /**
   * Determina si un slot pertenece a un día pasado o a un bloque de 30 min que ya finalizó hoy.
   */
  isSlotInPast(row: IDashboardTimeRow, cell?: IDashboardDoctorCell): boolean {
    const dayComp = this.selectedDayComparison();
    if (dayComp < 0) return true;
    if (dayComp > 0) return false;

    const slotEndMinutes = cell?.durationMinutes
      ? Math.max(row.endMinutes, row.startMinutes + cell.durationMinutes)
      : row.endMinutes;

    return slotEndMinutes <= this.currentMinutes();
  }

  /**
   * Determina si un slot pasado debe bloquear su interacción (todos excepto citas CONFIRMED o SCHEDULED).
   */
  isSlotDisabled(row: IDashboardTimeRow, cell: IDashboardDoctorCell): boolean {
    if (!this.isSlotInPast(row, cell)) {
      return false;
    }
    return cell.status !== 'CONFIRMED' && cell.status !== 'SCHEDULED';
  }

  onSlotSelect(cell: IDashboardDoctorCell, row?: IDashboardTimeRow): void {
    if (row && this.isSlotDisabled(row, cell)) {
      return;
    }
    this.slotClick.emit(cell);
  }

  /**
   * Calcula la altura proporcional en CSS según el spanRatio del procedimiento respecto a la fila base de 30 min
   */
  getCellHeightStyle(cell: IDashboardDoctorCell): string | null {
    const ratio = cell.spanRatio ?? 1;
    if (ratio === 1) {
      return null;
    }
    const percent = Math.round(ratio * 100);
    return `calc(${percent}% - 4px)`;
  }

  /**
   * Eleva el z-index de las citas confirmadas/agendadas que abarcan múltiples filas para que se superpongan limpiamente
   */
  getCellZIndex(cell: IDashboardDoctorCell): number {
    const baseZ = cell.geometry.zIndex;
    if ((cell.status === 'CONFIRMED' || cell.status === 'SCHEDULED') && !cell.isContinuation) {
      return baseZ + 5;
    }
    return baseZ;
  }
}

