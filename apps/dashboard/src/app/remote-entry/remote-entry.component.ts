import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MetricCardComponent } from '@nx-boilerplate/layouts';
import { formatDateYMD, getColombiaToday } from '@nx-boilerplate/utils';
import { DashboardStateService } from '../services/dashboard-state.service';
import { OtherCalendarsCardComponent } from '../components/other-calendars-card/other-calendars-card.component';
import { DailyCascadeCalendarComponent } from '../components/daily-cascade-calendar/daily-cascade-calendar.component';
import { IDashboardDoctorCell } from '../models/dashboard.models';

export interface IMiniCalendarDay {
  readonly date: Date;
  readonly dateKey: string;
  readonly dayNumber: number;
  readonly isCurrentMonth: boolean;
  readonly isToday: boolean;
  readonly isSelected: boolean;
}

@Component({
  selector: 'app-dashboard-entry',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MetricCardComponent,
    OtherCalendarsCardComponent,
    DailyCascadeCalendarComponent,
  ],
  templateUrl: './remote-entry.component.html',
  styleUrl: './remote-entry.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RemoteEntryComponent implements OnInit {
  readonly state = inject(DashboardStateService);

  readonly nextAvailableSubtitle = computed<string>(() => {
    return this.state.monthlyKpis().nextAvailableDate !== 'Sin Cupos este mes'
      ? 'Agendar en este espacio'
      : '';
  });

  readonly weekdayLabels = ['L', 'M', 'X', 'J', 'V', 'S', 'D'] as const;

  readonly #displayedMonth = signal<Date>(
    new Date(
      this.state.selectedDate().getFullYear(),
      this.state.selectedDate().getMonth(),
      1
    )
  );

  readonly calendarMonthLabel = computed<string>(() => {
    const d = this.#displayedMonth();
    const month = new Intl.DateTimeFormat('es-CO', { month: 'long' }).format(d);
    const capitalized = month.charAt(0).toUpperCase() + month.slice(1);
    return `${capitalized} ${d.getFullYear()}`;
  });

  readonly calendarDays = computed<readonly IMiniCalendarDay[]>(() => {
    const viewDate = this.#displayedMonth();
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    // Normalizar día de la semana para que Lunes = 0 ... Domingo = 6
    const startOffset = (firstDayOfMonth.getDay() + 6) % 7;
    const gridStartDate = new Date(year, month, 1 - startOffset);

    const todayStr = formatDateYMD(getColombiaToday());
    const selectedStr = formatDateYMD(this.state.selectedDate());

    const days: IMiniCalendarDay[] = [];
    for (let i = 0; i < 42; i++) {
      const cellDate = new Date(
        gridStartDate.getFullYear(),
        gridStartDate.getMonth(),
        gridStartDate.getDate() + i
      );
      const dateKey = formatDateYMD(cellDate);

      days.push({
        date: cellDate,
        dateKey,
        dayNumber: cellDate.getDate(),
        isCurrentMonth: cellDate.getMonth() === month,
        isToday: dateKey === todayStr,
        isSelected: dateKey === selectedStr,
      });
    }

    return days;
  });

  ngOnInit(): void {
    this.state.loadDoctors();
  }

  onDoctorSelect(cedula: string): void {
    this.state.selectDoctor(cedula);
  }

  onToggleComparedDoctor(cedula: string): void {
    this.state.toggleComparedDoctor(cedula);
  }

  onClearComparedDoctors(): void {
    this.state.clearComparedDoctors();
  }

  onChangeCalendarMonth(monthOffset: number): void {
    const current = this.#displayedMonth();
    this.#displayedMonth.set(
      new Date(current.getFullYear(), current.getMonth() + monthOffset, 1)
    );
  }

  onDateChange(newDate: Date | null): void {
    if (newDate) {
      this.state.selectDate(newDate);
      this.#displayedMonth.set(
        new Date(newDate.getFullYear(), newDate.getMonth(), 1)
      );
    }
  }

  onNavigateDay(offset: number): void {
    this.state.navigateRelativeDays(offset);
    const updated = this.state.selectedDate();
    this.#displayedMonth.set(
      new Date(updated.getFullYear(), updated.getMonth(), 1)
    );
  }

  onGoToToday(): void {
    this.state.selectToday();
    const today = this.state.selectedDate();
    this.#displayedMonth.set(new Date(today.getFullYear(), today.getMonth(), 1));
  }

  onSlotClick(cell: IDashboardDoctorCell): void {
    // Hook preparado para la Etapa 2 (Acciones granulares de agendamiento/edición/modal)
    console.debug('Slot clickeado en etapa 1:', cell);
  }
}
