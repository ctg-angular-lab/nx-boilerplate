import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  OnDestroy,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import {
  AgendarModalComponent,
  AgendarModalData,
  AgendarModalResult,
  ConfirmationModalComponent,
  ConfirmationModalData,
  MetricCardComponent,
  MetricCardStatItem,
} from '@nx-boilerplate/layouts';
import { IBookingPatient } from '@nx-boilerplate/api-interfaces';
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
    MatDialogModule,
    MetricCardComponent,
    OtherCalendarsCardComponent,
    DailyCascadeCalendarComponent,
  ],
  templateUrl: './remote-entry.component.html',
  styleUrl: './remote-entry.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RemoteEntryComponent implements OnInit, OnDestroy {
  readonly state = inject(DashboardStateService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);

  readonly appointmentReportStats = computed<readonly MetricCardStatItem[]>(() => {
    const kpis = this.state.monthlyKpis();
    return [
      { value: kpis.confirmedCount, label: 'Citas Confirmadas' },
      { value: kpis.scheduledCount, label: 'Citas Agendadas' },
      { value: kpis.cancelledCount, label: 'Citas Canceladas' },
    ];
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
    this.resetDashboardView();
  }

  ngOnDestroy(): void {
    this.resetDashboardView();
  }

  private resetDashboardView(): void {
    this.state.resetToDefaults();
    const today = getColombiaToday();
    this.#displayedMonth.set(new Date(today.getFullYear(), today.getMonth(), 1));
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

  onAvailableSlotItemClick(slotLabel: string): void {
    if (!slotLabel || slotLabel === 'Sin Cupos este mes') {
      return;
    }
    this.router.navigate(['/agendador-citas']);
  }

  onSlotClick(cell: IDashboardDoctorCell): void {
    if (cell.status === 'SCHEDULED' || cell.status === 'CONFIRMED') {
      this.openBookedAppointmentModal(cell);
      return;
    }
    this.openSlotConfirmationModal(cell);
  }

  private openBookedAppointmentModal(cell: IDashboardDoctorCell): void {
    const activeDate = this.state.selectedDate();
    const weekday = new Intl.DateTimeFormat('es-CO', { weekday: 'long' }).format(activeDate);
    const capWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
    const monthShort = new Intl.DateTimeFormat('es-CO', { month: 'short' }).format(activeDate);
    const timeLabel = cell.timeRangeLabel || '';
    const dateRange = `${capWeekday} ${activeDate.getDate()} ${monthShort}${
      timeLabel ? ' | ' + timeLabel : ''
    }`;

    let modalTitle = cell.procedureTitle || 'Cita Médica';
    let patientData: IBookingPatient | null = cell.patient ?? null;

    if (cell.procedureTitle?.includes(' - ')) {
      const parts = cell.procedureTitle.split(' - ');
      modalTitle = parts[0].replace(/^Cita Médica:\s*/i, '').trim() || parts[0].trim();
      const extractedName = parts.slice(1).join(' - ').trim();
      if (!patientData && extractedName) {
        patientData = {
          nombre: extractedName,
          apellidos: '',
          cedula: '',
          correo: '',
          celular: '',
        };
      }
    } else if (cell.procedureTitle) {
      modalTitle = cell.procedureTitle.replace(/^Cita Médica:\s*/i, '').trim();
    }

    if (!patientData && cell.patientName) {
      patientData = {
        nombre: cell.patientName,
        apellidos: '',
        cedula: '',
        correo: '',
        celular: '',
      };
    }

    const slotStatus = cell.status === 'SCHEDULED' ? 'TENTATIVE' : 'CONFIRMED';

    const dialogRef = this.dialog.open<
      AgendarModalComponent,
      AgendarModalData,
      AgendarModalResult
    >(AgendarModalComponent, {
      data: {
        title: modalTitle,
        professional: cell.doctorName,
        dateRange,
        patient: patientData,
        isTentativeView: true,
        colorId: cell.colorId ?? (slotStatus === 'TENTATIVE' ? '5' : '10'),
        startTime: cell.startTime,
        endTime: cell.endTime,
        slotStatus,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.goToConfirmationTab) {
        this.router.navigate(['/agendador-citas'], {
          queryParams: {
            tab: 'confirmacion',
            date: formatDateYMD(activeDate),
          },
        });
      }
    });
  }

  private openSlotConfirmationModal(_cell: IDashboardDoctorCell): void {
    const modalData: ConfirmationModalData<boolean> = {
      title: 'Confirmar agendamiento',
      text: '¿Quieres agendar una nueva cita en este espacio?',
      actions: [
        { label: 'Cancelar', color: 'default', value: false },
        { label: 'Confirmar', color: 'primary', value: true },
      ],
    };

    const dialogRef = this.dialog.open<
      ConfirmationModalComponent,
      ConfirmationModalData<boolean>,
      boolean
    >(ConfirmationModalComponent, {
      data: modalData,
      width: '420px',
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.router.navigate(['/agendador-citas']);
      }
    });
  }
}
