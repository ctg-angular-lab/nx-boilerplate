import {
  ChangeDetectionStrategy,
  Component,
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
}

