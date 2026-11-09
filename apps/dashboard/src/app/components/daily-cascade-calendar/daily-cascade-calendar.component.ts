import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
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

@Component({
  selector: 'app-daily-cascade-calendar',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './daily-cascade-calendar.component.html',
  styleUrl: './daily-cascade-calendar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DailyCascadeCalendarComponent {
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

  onPrevDay(): void {
    this.navigateDay.emit(-1);
  }

  onNextDay(): void {
    this.navigateDay.emit(1);
  }

  onToday(): void {
    this.goToToday.emit();
  }

  onSlotSelect(cell: IDashboardDoctorCell): void {
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

