import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  OnInit,
  inject,
  DestroyRef,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import {
  AppointmentConfirmationStatus,
  IProfessionalSummary,
} from '@nx-boilerplate/api-interfaces';
import {
  formatDateYMD,
  getColombiaToday,
  getNextWorkingDays,
} from '@nx-boilerplate/utils';
import { DashboardSummaryStats } from '../../../services/confirmacion-citas.service';

export interface QuickDateOption {
  dateStr: string;
  label: string;
  isToday: boolean;
}

@Component({
  selector: 'app-filtros-confirmacion',
  standalone: true,
  providers: [provideNativeDateAdapter()],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatIconModule,
    MatBadgeModule,
  ],
  templateUrl: './filtros-confirmacion.component.html',
  styleUrl: './filtros-confirmacion.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FiltrosConfirmacionComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  // Inputs con Signals
  readonly selectedDate = input.required<string>();
  readonly selectedStatus = input.required<AppointmentConfirmationStatus | 'ALL'>();
  readonly selectedDoctorEmail = input<string | null>(null);
  readonly searchQuery = input<string>('');
  readonly professionals = input<IProfessionalSummary[]>([]);
  readonly summaryStats = input<DashboardSummaryStats>({
    total: 0,
    tentative: 0,
    confirmed: 0,
    cancelled: 0,
  });

  // Outputs con Signals
  readonly dateChange = output<string>();
  readonly statusChange = output<AppointmentConfirmationStatus | 'ALL'>();
  readonly doctorChange = output<string | null>();
  readonly searchChange = output<string>();

  // Control reactivo de búsqueda
  readonly searchControl = new FormControl<string>('', { nonNullable: true });

  // Fechas rápidas laborables calculadas (omitiendo domingos)
  readonly quickDateOptions: QuickDateOption[] = this.calculateQuickDateOptions();

  /**
   * Calcula los próximos 3 días hábiles laborables omitiendo domingos (día de descanso)
   */
  private calculateQuickDateOptions(): QuickDateOption[] {
    const today = getColombiaToday();
    const todayTime = today.getTime();
    const workingDays = getNextWorkingDays(3, today);

    return workingDays.map((day) => ({
      dateStr: formatDateYMD(day),
      label: this.formatPillDate(day),
      isToday: day.getTime() === todayTime,
    }));
  }

  /**
   * Formatea una fecha al formato "Día, DD mes" (ej: "Sábado, 10 oct")
   */
  private formatPillDate(date: Date): string {
    const weekday = new Intl.DateTimeFormat('es-CO', { weekday: 'long' }).format(date);
    const day = date.getDate();
    const month = new Intl.DateTimeFormat('es-CO', { month: 'short' }).format(date).replace('.', '');
    const capitalizedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
    return `${capitalizedWeekday}, ${day} ${month}`;
  }

  /**
   * Determina si la fecha actualmente seleccionada corresponde a uno de los botones rápidos
   */
  isQuickDateSelected(): boolean {
    return this.quickDateOptions.some((opt) => opt.dateStr === this.selectedDate());
  }

  ngOnInit(): void {
    this.searchControl.setValue(this.searchQuery(), { emitEvent: false });

    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((query) => {
        this.searchChange.emit(query);
      });
  }

  onPillSelect(dateStr: string): void {
    this.dateChange.emit(dateStr);
  }

  onCustomDateSelect(date: Date | null): void {
    if (date) {
      this.dateChange.emit(formatDateYMD(date));
    }
  }

  onStatusToggle(status: AppointmentConfirmationStatus | 'ALL'): void {
    this.statusChange.emit(status);
  }

  onDoctorSelect(email: string | null): void {
    this.doctorChange.emit(email);
  }

  clearSearch(): void {
    this.searchControl.setValue('');
  }
}
