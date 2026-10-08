import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { IBookingPatient } from '@nx-boilerplate/api-interfaces';
import {
  AgendarModalData,
  AgendarModalResult,
} from '../models/agendar-modal.models';

@Component({
  selector: 'lib-agendar-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './agendar-modal.component.html',
  styleUrl: './agendar-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgendarModalComponent {
  readonly dialogRef = inject(MatDialogRef<AgendarModalComponent>);
  readonly data = inject<AgendarModalData>(MAT_DIALOG_DATA, { optional: true });

  // Ubicación estática requerida en la especificación
  readonly location = 'Cra 79 # 49A-107, Laureles - Estadio';

  // Estado reactivo gobernado con Signals
  readonly isTentativeView = signal<boolean>(Boolean(this.data?.isTentativeView));
  readonly colorId = signal<string | null>(this.data?.colorId ?? null);
  readonly initialNotes = signal<string>(this.data?.notes || '');
  readonly subtitle = computed(() =>
    this.isTentativeView() ? 'Cita pendiente de Confirmacion' : 'Confirma los detalles de tu cita médica'
  );

  readonly title = signal<string>(this.data?.title?.trim() || 'Consulta de Evaluación');
  readonly dateRange = signal<string>(this.data?.dateRange || '');
  readonly professional = signal<string>(
    this.data?.professional?.trim() || 'Profesional seleccionado'
  );
  readonly patient = signal<IBookingPatient | null | undefined>(
    this.data?.patient ?? null
  );

  readonly startTime = signal<string | null>(this.data?.startTime ?? null);
  readonly endTime = signal<string | null>(this.data?.endTime ?? null);
  readonly slotStatus = signal<string | null>(
    this.data?.slotStatus ?? (this.data?.isTentativeView ? 'TENTATIVE' : null)
  );
  readonly isTentativeStatus = computed(() => this.slotStatus() === 'TENTATIVE');

  readonly showNotesField = signal<boolean>(false);
  readonly notesControl = new FormControl<string>('', {
    nonNullable: true,
    validators: [Validators.maxLength(200)],
  });

  // Helpers computados para renderizado de información del paciente
  readonly patientFullName = computed(() => {
    const p = this.patient();
    if (!p) return null;
    const name = p.nombre || '';
    const lastName = p.apellidos || '';
    const full = `${name} ${lastName}`.trim();
    return full || 'Paciente registrado';
  });

  readonly patientFirstName = computed(() => {
    const p = this.patient();
    if (!p) return 'paciente';
    const rawName = p.nombre?.trim() || '';
    if (!rawName) return 'paciente';
    return rawName.split(' ')[0];
  });

  readonly patientDocument = computed(() => {
    const p = this.patient();
    return p?.cedula?.trim() || null;
  });

  readonly patientPhone = computed(() => {
    const p = this.patient();
    if (!p) return null;
    const phone = p.celular || (p as unknown as { patientPhone?: string }).patientPhone || '';
    return phone.trim() || null;
  });

  readonly googleCalendarInviteUrl = computed(() => {
    const start = this.startTime();
    const end = this.endTime();
    if (!start || !end) return null;

    try {
      const startDate = new Date(start);
      const endDate = new Date(end);
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return null;

      const formatGCal = (d: Date) =>
        d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

      const title = encodeURIComponent(`Cita Médica: ${this.title()} - Las Dras Botero`);
      const details = encodeURIComponent(
        `Cita médica confirmada con Las Dras Botero (${this.professional()}).\n` +
          `Paciente: ${this.patientFullName() || 'Paciente'}.\n` +
          `Procedimiento: ${this.title()}.`
      );
      const location = encodeURIComponent(this.location);

      return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${formatGCal(
        startDate
      )}/${formatGCal(endDate)}&details=${details}&location=${location}`;
    } catch {
      return null;
    }
  });

  readonly formattedDateForMessage = computed(() => {
    const start = this.startTime();
    if (!start) return this.dateRange() || 'fecha programada';

    try {
      const d = new Date(start);
      if (isNaN(d.getTime())) return this.dateRange() || 'fecha programada';

      const day = d.getDate();
      const months = [
        'Enero',
        'Febrero',
        'Marzo',
        'Abril',
        'Mayo',
        'Junio',
        'Julio',
        'Agosto',
        'Septiembre',
        'Octubre',
        'Noviembre',
        'Diciembre',
      ];
      const month = months[d.getMonth()];
      const year = d.getFullYear();

      let hours = d.getHours();
      const minutes = d.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;

      return `${day} de ${month} de ${year} a las ${hours}:${minutes} ${ampm}`;
    } catch {
      return this.dateRange() || 'fecha programada';
    }
  });

  readonly patientWhatsAppUrl = computed(() => {
    const rawPhone = this.patientPhone();
    if (!rawPhone) return null;

    const digitsOnly = rawPhone.replace(/\D/g, '');
    if (!digitsOnly) return null;

    // Normalizar indicativo de Colombia si son 10 dígitos estándar
    const fullPhone = digitsOnly.length === 10 ? `57${digitsOnly}` : digitsOnly;
    const firstName = this.patientFirstName();
    const fechaTexto = this.formattedDateForMessage();

    const message = `Hola ${firstName}, te escribimos de Dras. Botero para confirmar tu cita con el/la Dr(a). ${this.professional()}  el ${fechaTexto}. ¿Nos confirmas tu asistencia con un SÍ?`;

    return `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`;
  });

  toggleNotes(): void {
    this.showNotesField.update((current) => !current);
  }

  onCancel(): void {
    const result: AgendarModalResult = { agendar: false };
    this.dialogRef.close(result);
  }

  onGoToStepper(): void {
    const result: AgendarModalResult = {
      agendar: false,
      goToStepper: true,
    };
    this.dialogRef.close(result);
  }

  onConfirm(): void {
    if (!this.patient()) {
      return;
    }
    const notesValue = this.notesControl.value.trim();
    const result: AgendarModalResult = {
      agendar: true,
      ...(notesValue ? { notes: notesValue } : {}),
    };
    this.dialogRef.close(result);
  }
}
