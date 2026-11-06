import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MetricCardComponent } from '@nx-boilerplate/layouts';
import { DashboardStateService } from '../services/dashboard-state.service';
import { OtherCalendarsCardComponent } from '../components/other-calendars-card/other-calendars-card.component';
import { DailyCascadeCalendarComponent } from '../components/daily-cascade-calendar/daily-cascade-calendar.component';
import { IDashboardDoctorCell } from '../models/dashboard.models';

@Component({
  selector: 'app-dashboard-entry',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatDatepickerModule,
    MatButtonModule,
    MatTooltipModule,
    MetricCardComponent,
    OtherCalendarsCardComponent,
    DailyCascadeCalendarComponent,
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './remote-entry.component.html',
  styleUrl: './remote-entry.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RemoteEntryComponent implements OnInit {
  readonly state = inject(DashboardStateService);

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

  onDateChange(newDate: Date | null): void {
    if (newDate) {
      this.state.selectDate(newDate);
    }
  }

  onNavigateDay(offset: number): void {
    this.state.navigateRelativeDays(offset);
  }

  onGoToToday(): void {
    this.state.selectToday();
  }

  onSlotClick(cell: IDashboardDoctorCell): void {
    // Hook preparado para la Etapa 2 (Acciones granulares de agendamiento/edición/modal)
    console.debug('Slot clickeado en etapa 1:', cell);
  }
}
