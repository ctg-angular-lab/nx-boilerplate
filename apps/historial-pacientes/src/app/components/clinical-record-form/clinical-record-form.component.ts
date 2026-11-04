import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import {
  ICitaMedica,
  ICreateClinicalRecordRequest,
  IPatientHistory,
  IUpdateClinicalRecordRequest,
} from '@nx-boilerplate/api-interfaces';
import { HistorialPacientesService } from '../../services/historial-pacientes.service';

export interface ClinicalRecordFormModel {
  cedula_profesional: FormControl<string>;
  fecha_atencion: FormControl<string>;
  procedimiento_realizado: FormControl<string>;
  lote_producto: FormControl<string>;
  motivo_consulta: FormControl<string>;
  enfermedad_actual: FormControl<string>;
  patologicos: FormControl<string>;
  alergicos: FormControl<string>;
  farmacologicos: FormControl<string>;
  procedimientos_previos: FormControl<string>;
  examen_fisico: FormControl<string>;
  recomendaciones: FormControl<string>;
  consentimiento_informado: FormControl<boolean>;
  descargable_consentimiento: FormControl<string>;
}

@Component({
  selector: 'app-clinical-record-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
  ],
  templateUrl: './clinical-record-form.component.html',
  styleUrl: './clinical-record-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClinicalRecordFormComponent {
  private readonly fb = inject(FormBuilder);
  readonly service = inject(HistorialPacientesService);
  private readonly dialogRef = inject(MatDialogRef, { optional: true });

  // --- Inputs ---
  readonly record = input<ICitaMedica | null>(null);
  readonly patient = input.required<IPatientHistory>();
  readonly doctorName = input<string>('');

  // --- Outputs ---
  readonly saved = output<ICitaMedica>();
  readonly cancelled = output<void>();

  // --- Estado local ---
  readonly isSaving = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  // --- Computeds ---
  readonly isManualCreation = computed(() => this.record() === null);

  readonly preloadedDoctor = computed(() => {
    return this.record()?.medico_tratante?.[0];
  });

  // --- Formulario Reactivo ---
  readonly form: FormGroup<ClinicalRecordFormModel> = this.fb.group({
    cedula_profesional: this.fb.control('', { nonNullable: true }),
    fecha_atencion: this.fb.control(
      new Date().toISOString().split('T')[0],
      { nonNullable: true, validators: [Validators.required] }
    ),
    procedimiento_realizado: this.fb.control('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    lote_producto: this.fb.control('N/A', { nonNullable: true }),
    motivo_consulta: this.fb.control('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    enfermedad_actual: this.fb.control('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    patologicos: this.fb.control('Ninguno', { nonNullable: true }),
    alergicos: this.fb.control('Ninguno', { nonNullable: true }),
    farmacologicos: this.fb.control('Ninguno', { nonNullable: true }),
    procedimientos_previos: this.fb.control('Ninguno', { nonNullable: true }),
    examen_fisico: this.fb.control('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    recomendaciones: this.fb.control('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    consentimiento_informado: this.fb.control(true, { nonNullable: true }),
    descargable_consentimiento: this.fb.control('Pendiente de adjunto', {
      nonNullable: true,
    }),
  });

  constructor() {
    effect(() => {
      const currentRecord = this.record();

      if (currentRecord) {
        const reg = currentRecord.registro_clinico;
        const firstDoc = currentRecord.medico_tratante?.[0];
        const rawDate = firstDoc?.fecha_atencion;
        const dateStr =
          rawDate instanceof Date
            ? rawDate.toISOString().split('T')[0]
            : typeof rawDate === 'string'
            ? rawDate
            : new Date().toISOString().split('T')[0];

        this.form.patchValue({
          cedula_profesional: firstDoc?.cedula_profesional || '',
          fecha_atencion: dateStr,
          procedimiento_realizado: reg?.procedimiento_realizado || '',
          lote_producto: reg?.lote_producto || 'N/A',
          motivo_consulta: reg?.motivo_consulta || '',
          enfermedad_actual: reg?.enfermedad_actual || '',
          patologicos: reg?.antecedentes_medicos?.patologicos || 'Ninguno',
          alergicos: reg?.antecedentes_medicos?.alergicos || 'Ninguno',
          farmacologicos: reg?.antecedentes_medicos?.farmacologicos || 'Ninguno',
          procedimientos_previos:
            reg?.antecedentes_medicos?.procedimientos_previos || 'Ninguno',
          examen_fisico: reg?.examen_fisico || '',
          recomendaciones: reg?.recomendaciones || '',
          consentimiento_informado:
            currentRecord.soporte_documental?.consentimiento_informado ?? true,
          descargable_consentimiento:
            currentRecord.soporte_documental?.descargable_consentimiento ||
            'Pendiente de adjunto',
        });
      } else {
        // En creación manual, cedula_profesional es obligatoria
        this.form.controls.cedula_profesional.setValidators([Validators.required]);
        this.form.controls.cedula_profesional.updateValueAndValidity({
          emitEvent: false,
        });
      }
    });
  }

  /**
   * Sanitiza el payload asegurando que ningún string requerido viaje vacío ""
   * para cumplir estrictamente con los decoradores @IsNotEmpty() del backend.
   */
  private sanitize(val?: string | null, def = 'Ninguno'): string {
    return val?.trim() || def;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage.set(
        'Por favor complete los campos obligatorios del registro clínico.'
      );
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);

    const values = this.form.getRawValue();
    const currentRecord = this.record();

    const registroClinico = {
      motivo_consulta: values.motivo_consulta.trim(),
      enfermedad_actual: values.enfermedad_actual.trim(),
      antecedentes_medicos: {
        patologicos: this.sanitize(values.patologicos),
        alergicos: this.sanitize(values.alergicos),
        farmacologicos: this.sanitize(values.farmacologicos),
        procedimientos_previos: this.sanitize(values.procedimientos_previos),
      },
      examen_fisico: values.examen_fisico.trim(),
      procedimiento_realizado: values.procedimiento_realizado.trim(),
      lote_producto: this.sanitize(values.lote_producto, 'N/A'),
      recomendaciones: values.recomendaciones.trim(),
    };

    const soporteDocumental = {
      consentimiento_informado: values.consentimiento_informado,
      descargable_consentimiento: this.sanitize(
        values.descargable_consentimiento,
        'Pendiente de adjunto'
      ),
    };

    if (currentRecord) {
      // Edición / Diligenciamiento de Cita Existente
      const recordId =
        (currentRecord as { _id?: string })._id || currentRecord.appointmentId;

      if (!recordId) {
        this.isSaving.set(false);
        this.errorMessage.set('Identificador del registro clínico no encontrado.');
        return;
      }

      const updatePayload: IUpdateClinicalRecordRequest = {
        estado_registro: 'COMPLETADA',
        registro_clinico: registroClinico,
        soporte_documental: soporteDocumental,
      };

      this.service.updateClinicalRecord(recordId, updatePayload).subscribe({
        next: (updated) => {
          this.isSaving.set(false);
          this.saved.emit(updated);
          this.dialogRef?.close(updated);
        },
        error: (err) => {
          this.isSaving.set(false);
          const msg =
            err?.error?.message ||
            err?.message ||
            'Error al guardar la historia clínica.';
          this.errorMessage.set(Array.isArray(msg) ? msg.join(', ') : msg);
        },
      });
    } else {
      // Creación de Atención Manual sin cita previa
      const docCedula = values.cedula_profesional;
      const docName = this.service.resolveDoctorName(docCedula);

      const createPayload: ICreateClinicalRecordRequest = {
        cedula_paciente: this.patient().cedula,
        estado_registro: 'COMPLETADA',
        medico_tratante: [
          {
            cedula_profesional: docCedula,
            nombre_profesional: docName,
            fecha_atencion: values.fecha_atencion,
          },
        ],
        registro_clinico: registroClinico,
        soporte_documental: soporteDocumental,
      };

      this.service.createClinicalRecord(createPayload).subscribe({
        next: (created) => {
          this.isSaving.set(false);
          this.saved.emit(created);
          this.dialogRef?.close(created);
        },
        error: (err) => {
          this.isSaving.set(false);
          const msg =
            err?.error?.message ||
            err?.message ||
            'Error al registrar la historia clínica.';
          this.errorMessage.set(Array.isArray(msg) ? msg.join(', ') : msg);
        },
      });
    }
  }

  onCancel(): void {
    this.cancelled.emit();
    this.dialogRef?.close(null);
  }
}
