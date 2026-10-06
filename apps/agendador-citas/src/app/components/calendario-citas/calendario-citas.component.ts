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
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog } from '@angular/material/dialog';
import { CalendarDay, TimeSlot } from '@nx-boilerplate/api-interfaces';
import {
  AgendarModalComponent,
  AgendarModalData,
  AgendarModalResult,
  ConfirmationModalComponent,
  ConfirmationModalData,
} from '@nx-boilerplate/layouts';
import { AppointmentLogicService } from '../../services/appointment-logic.service';
import { AGENDADOR_TABS } from '../../models/booking.models';

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
  private readonly dialog = inject(MatDialog);

  readonly baseTitle = signal<string>('Calendario');

  /**
   * Catálogo de profesionales disponibles y profesional activo en el calendario
   */
  readonly activeProfessional = this.appointmentLogic.activeProfessional;
  readonly availableProfessionals = this.appointmentLogic.availableProfessionals;

  /**
   * Estado de carga de la disponibilidad semanal
   */
  readonly isLoading = this.appointmentLogic.isLoadingCalendar;

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
   * Indica si la vista actual corresponde a la semana actual (impide ir al pasado)
   */
  readonly isCurrentWeek = computed(() => this.appointmentLogic.currentWeekOffset() === 0);

  /**
   * Enlace reactivo directo con el Signal inmutable del servicio
   */
  readonly weekDays = this.appointmentLogic.weekDays;

  /**
   * Estado de flujo de agendamiento contextual proveniente del Stepper
   */
  readonly isBookingMode = this.appointmentLogic.isBookingMode;
  readonly bookingContext = this.appointmentLogic.bookingContext;

  /**
   * Advertencia o error de disponibilidad (sin turnos en 4 semanas)
   */
  readonly calendarError = this.appointmentLogic.calendarError;

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

  /**
   * Regresa inmediatamente a la semana actual de Colombia
   */
  goToToday(): void {
    if (!this.isCurrentWeek()) {
      this.appointmentLogic.goToToday();
      this.selectedSlot.set(null);
    }
  }

  /**
   * Retrocede una semana (bloqueado si ya está en la semana actual)
   */
  previousWeek(): void {
    if (!this.isCurrentWeek()) {
      this.appointmentLogic.previousWeek();
      this.selectedSlot.set(null);
    }
  }

  /**
   * Avanza a la semana siguiente
   */
  nextWeek(): void {
    this.appointmentLogic.nextWeek();
    this.selectedSlot.set(null);
  }

  /**
   * Cancela el modo de agendamiento contextual regresando a consulta general
   */
  cancelBookingFlow(): void {
    this.appointmentLogic.clearBookingContext();
  }

  /**
   * Permite al paciente registrarse en la lista de espera cuando no hay cupos en 4 semanas
   */
  onWaitlistFromCalendar(): void {
    const professional = this.activeProfessional();
    const doctorName = professional
      ? `${professional.nombres} ${professional.apellidos}`.trim()
      : 'el profesional';

    const modalData: ConfirmationModalData<boolean> = {
      title: 'Lista de Espera',
      text: `¿Desea registrarse en la lista de espera con ${doctorName}? Le notificaremos automáticamente tan pronto se libere un turno.`,
      actions: [
        { label: 'Unirme a la lista', color: 'primary', value: true },
        { label: 'Cancelar', color: 'default', value: false },
      ],
    };

    const dialogRef = this.dialog.open(ConfirmationModalComponent, {
      data: modalData,
      width: '450px',
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        console.log('Paciente anotado en lista de espera para:', doctorName);
      }
    });
  }

  /**
   * Maneja el clic en un slot disponible para abrir el modal de confirmación de agendamiento
   */
  onSlotClick(slot: TimeSlot, day: CalendarDay): void {
    if (slot.status === 'reservado') {
      return;
    }

    this.selectedSlot.set(this.selectedSlot()?.id === slot.id ? null : slot);

    const professional = this.activeProfessional();
    const nombreProfesional = professional
      ? `${professional.nombres} ${professional.apellidos}`.trim()
      : 'Profesional seleccionado';

    const fechaFormateada = `${day.label} ${day.subLabel} | ${slot.time}`;
    const bookingCtx = this.bookingContext();

    const dialogRef = this.dialog.open<
      AgendarModalComponent,
      AgendarModalData,
      AgendarModalResult
    >(AgendarModalComponent, {
      data: {
        title: bookingCtx?.procedure?.nombreProcedimiento || 'Consulta de Evaluación',
        professional: nombreProfesional,
        dateRange: fechaFormateada,
        patient: bookingCtx?.patient ?? null,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.goToStepper) {
        this.appointmentLogic.setActiveTab(AGENDADOR_TABS.FORM);
        this.selectedSlot.set(null);
        return;
      }

      if (result?.agendar) {
        this.appointmentLogic.bookSlot(slot, result.notes).subscribe({
          next: (response) => {
            console.log('Cita agendada exitosamente', response);
            this.openSuccessModal();
            this.selectedSlot.set(null);
          },
          error: (err) => {
            console.error('Error agendando la cita', err);
          },
        });
      }
    });
  }

  /**
   * Despliega el modal de confirmación exitosa del agendamiento
   */
  openSuccessModal(): void {
    const modalData: ConfirmationModalData<boolean> = {
      title: '¡Cita Confirmada con Éxito!',
      text: 'Tu cita médica ha sido agendada correctamente. Hemos enviado los detalles a tu correo electrónico registrado.',
      actions: [
        { label: 'Aceptar', color: 'primary', value: true },
      ],
    };

    this.dialog.open(ConfirmationModalComponent, {
      data: modalData,
      width: '450px',
      disableClose: true,
    });
  }

  /**
   * Verifica si el slot dado está actualmente seleccionado
   */
  isSlotSelected(slot: TimeSlot): boolean {
    return this.selectedSlot()?.id === slot.id;
  }
}
