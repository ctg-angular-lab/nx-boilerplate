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
import { ICreateAppointmentRequest } from '@nx-boilerplate/api-interfaces';
import {
  AgendarModalData,
  AgendarModalResult,
  IAgendarModalPatient,
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
  readonly location = 'Calle 27 # 40-46, El Poblado';

  // Estado reactivo gobernado con Signals
  readonly title = signal<string>(this.data?.title?.trim() || 'Consulta de Evaluación');
  readonly dateRange = signal<string>(this.data?.dateRange || this.data?.fecha || '');
  readonly professional = signal<string>(
    this.data?.professional?.trim() || this.data?.profesional?.trim() || 'Profesional seleccionado'
  );
  readonly patient = signal<IAgendarModalPatient | ICreateAppointmentRequest | null | undefined>(
    this.data?.patient ?? null
  );

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

  readonly patientDocument = computed(() => {
    const p = this.patient();
    if (!p) return null;
    return (
      p.cedula ||
      ('patientNationalId' in p ? (p as ICreateAppointmentRequest).patientNationalId : null) ||
      null
    );
  });

  toggleNotes(): void {
    this.showNotesField.update((current) => !current);
  }

  onCancel(): void {
    const result: AgendarModalResult = { agendar: false };
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
