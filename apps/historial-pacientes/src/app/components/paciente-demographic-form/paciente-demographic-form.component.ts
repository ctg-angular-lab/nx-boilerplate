import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
  ICreatePatientRequest,
  IPatientHistory,
  IUpdatePatientRequest,
} from '@nx-boilerplate/api-interfaces';
import { calculateAgeFromBirthDate } from '@nx-boilerplate/utils';
import {
  ESTADOS_CIVILES,
  SEXOS_PACIENTE,
  TIPOS_DOCUMENTO,
  TIPOS_VINCULACION,
  normalizePatientForForm,
} from '../../models/historial-pacientes.models';
import { HistorialPacientesService } from '../../services/historial-pacientes.service';

export interface PacienteFormModel {
  tipo_documento: FormControl<string>;
  cedula: FormControl<string>;
  nombre: FormControl<string>;
  apellidos: FormControl<string>;
  correo: FormControl<string>;
  celular: FormControl<string>;
  fecha_nacimiento: FormControl<string>;
  edad: FormControl<number | null>;
  sexo: FormControl<string>;
  estado_civil: FormControl<string>;
  ocupacion: FormControl<string>;
  direccion_residencia: FormControl<string>;
  aseguradora: FormControl<string>;
  tipo_vinculacion: FormControl<string>;
  es_menor_de_edad: FormControl<boolean>;
  acompanante: FormGroup<{
    nombre: FormControl<string>;
    telefono: FormControl<string>;
  }>;
  persona_responsable: FormGroup<{
    nombre: FormControl<string>;
    telefono: FormControl<string>;
    parentesco: FormControl<string>;
  }>;
  recomendaciones: FormControl<string>;
}

@Component({
  selector: 'app-paciente-demographic-form',
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
  templateUrl: './paciente-demographic-form.component.html',
  styleUrl: './paciente-demographic-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PacienteDemographicFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly historialService = inject(HistorialPacientesService);
  private readonly dialogRef = inject(MatDialogRef, { optional: true });

  // --- Inputs ---
  readonly patient = input<IPatientHistory | null>(null);
  readonly mode = input<'create' | 'edit'>('create');
  readonly showActions = input<boolean>(true);

  // --- Outputs ---
  readonly saved = output<IPatientHistory>();
  readonly cancelled = output<void>();

  // --- Catálogos ---
  readonly tiposDocumento = TIPOS_DOCUMENTO;
  readonly sexos = SEXOS_PACIENTE;
  readonly estadosCiviles = ESTADOS_CIVILES;
  readonly tiposVinculacion = TIPOS_VINCULACION;

  // --- Estado local ---
  readonly isSaving = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  // --- Formulario Reactivo ---
  readonly form: FormGroup<PacienteFormModel> = this.fb.group({
    tipo_documento: this.fb.control('CC', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    cedula: this.fb.control('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(5),
        Validators.maxLength(20),
        Validators.pattern(/^[a-zA-Z0-9]+$/),
      ],
    }),
    nombre: this.fb.control('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)],
    }),
    apellidos: this.fb.control('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)],
    }),
    correo: this.fb.control('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    celular: this.fb.control('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.pattern(/^[0-9+ ]{7,15}$/),
      ],
    }),
    fecha_nacimiento: this.fb.control('', { nonNullable: true }),
    edad: this.fb.control<number | null>({ value: null, disabled: true }),
    sexo: this.fb.control('', { nonNullable: true }),
    estado_civil: this.fb.control('', { nonNullable: true }),
    ocupacion: this.fb.control('', { nonNullable: true }),
    direccion_residencia: this.fb.control('', { nonNullable: true }),
    aseguradora: this.fb.control('', { nonNullable: true }),
    tipo_vinculacion: this.fb.control('', { nonNullable: true }),
    es_menor_de_edad: this.fb.control(false, { nonNullable: true }),
    acompanante: this.fb.group({
      nombre: this.fb.control('', { nonNullable: true }),
      telefono: this.fb.control('', { nonNullable: true }),
    }),
    persona_responsable: this.fb.group({
      nombre: this.fb.control('', { nonNullable: true }),
      telefono: this.fb.control('', { nonNullable: true }),
      parentesco: this.fb.control('', { nonNullable: true }),
    }),
    recomendaciones: this.fb.control('', { nonNullable: true }),
  });

  constructor() {
    this.setupAgeCalculation();
    this.setupMinorValidation();

    // Sincronización reactiva con el input patient() y mode()
    effect(() => {
      const currentPatient = this.patient();
      const currentMode = this.mode();

      if (currentPatient) {
        const normalized = normalizePatientForForm(currentPatient);
        this.form.patchValue({
          tipo_documento: normalized.tipo_documento || 'CC',
          cedula: normalized.cedula,
          nombre: normalized.nombre,
          apellidos: normalized.apellidos,
          correo: normalized.correo,
          celular: normalized.celular,
          fecha_nacimiento: normalized.fecha_nacimiento,
          edad: normalized.edad,
          sexo: normalized.sexo,
          estado_civil: normalized.estado_civil,
          ocupacion: normalized.ocupacion,
          direccion_residencia: normalized.direccion_residencia,
          aseguradora: normalized.aseguradora,
          tipo_vinculacion: normalized.tipo_vinculacion,
          es_menor_de_edad: normalized.es_menor_de_edad,
          acompanante: normalized.acompanante,
          persona_responsable: normalized.persona_responsable,
          recomendaciones: currentPatient.recomendaciones || '',
        });

        // Recalcular edad si hay fecha de nacimiento pero edad vino null
        if (normalized.fecha_nacimiento && normalized.edad === null) {
          const calculated = calculateAgeFromBirthDate(normalized.fecha_nacimiento);
          this.form.controls.edad.setValue(calculated, { emitEvent: false });
        }
      }

      if (currentMode === 'edit') {
        this.form.controls.cedula.disable({ emitEvent: false });
        this.form.controls.tipo_documento.disable({ emitEvent: false });
      } else {
        this.form.controls.cedula.enable({ emitEvent: false });
        this.form.controls.tipo_documento.enable({ emitEvent: false });
      }
    });
  }

  private setupAgeCalculation(): void {
    this.form.controls.fecha_nacimiento.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((birthDate) => {
        const calculatedAge = calculateAgeFromBirthDate(birthDate);
        this.form.controls.edad.setValue(calculatedAge, { emitEvent: false });

        if (calculatedAge !== null) {
          const isMinor = calculatedAge < 18;
          this.form.controls.es_menor_de_edad.setValue(isMinor);
        }
      });
  }

  private setupMinorValidation(): void {
    this.form.controls.es_menor_de_edad.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((isMinor) => {
        const respGroup = this.form.controls.persona_responsable;

        if (isMinor) {
          respGroup.controls.nombre.setValidators([Validators.required]);
          respGroup.controls.telefono.setValidators([Validators.required]);
          respGroup.controls.parentesco.setValidators([Validators.required]);
        } else {
          respGroup.controls.nombre.clearValidators();
          respGroup.controls.telefono.clearValidators();
          respGroup.controls.parentesco.clearValidators();
        }

        respGroup.controls.nombre.updateValueAndValidity();
        respGroup.controls.telefono.updateValueAndValidity();
        respGroup.controls.parentesco.updateValueAndValidity();
      });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage.set(
        'Por favor complete los campos obligatorios antes de continuar.'
      );
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const rawValues = this.form.getRawValue();
    const currentMode = this.mode();

    if (currentMode === 'create') {
      const payload: ICreatePatientRequest = {
        cedula: rawValues.cedula.trim(),
        tipo_documento: rawValues.tipo_documento,
        nombre: rawValues.nombre.trim(),
        apellidos: rawValues.apellidos.trim(),
        correo: rawValues.correo.trim().toLowerCase(),
        celular: rawValues.celular.trim(),
        fecha_nacimiento: rawValues.fecha_nacimiento || null,
        edad: rawValues.edad,
        sexo: rawValues.sexo || null,
        estado_civil: rawValues.estado_civil || null,
        ocupacion: rawValues.ocupacion?.trim() || null,
        direccion_residencia: rawValues.direccion_residencia?.trim() || null,
        aseguradora: rawValues.aseguradora?.trim() || null,
        tipo_vinculacion: rawValues.tipo_vinculacion || null,
        es_menor_de_edad: rawValues.es_menor_de_edad,
        acompanante: {
          nombre: rawValues.acompanante.nombre?.trim() || null,
          telefono: rawValues.acompanante.telefono?.trim() || null,
        },
        persona_responsable: {
          nombre: rawValues.persona_responsable.nombre?.trim() || null,
          telefono: rawValues.persona_responsable.telefono?.trim() || null,
          parentesco: rawValues.persona_responsable.parentesco?.trim() || null,
        },
        recomendaciones: rawValues.recomendaciones?.trim() || undefined,
      };

      this.historialService.createPatient(payload).subscribe({
        next: (created) => {
          this.isSaving.set(false);
          this.successMessage.set('Paciente registrado exitosamente.');
          this.saved.emit(created);
          this.dialogRef?.close(created);
        },
        error: (err) => {
          this.isSaving.set(false);
          const msg =
            err?.error?.message ||
            err?.message ||
            'Error al registrar el paciente.';
          this.errorMessage.set(Array.isArray(msg) ? msg.join(', ') : msg);
        },
      });
    } else {
      const cedula = this.patient()?.cedula || rawValues.cedula;
      const payload: IUpdatePatientRequest = {
        nombre: rawValues.nombre.trim(),
        apellidos: rawValues.apellidos.trim(),
        correo: rawValues.correo.trim().toLowerCase(),
        celular: rawValues.celular.trim(),
        fecha_nacimiento: rawValues.fecha_nacimiento || null,
        edad: rawValues.edad,
        sexo: rawValues.sexo || null,
        estado_civil: rawValues.estado_civil || null,
        ocupacion: rawValues.ocupacion?.trim() || null,
        direccion_residencia: rawValues.direccion_residencia?.trim() || null,
        aseguradora: rawValues.aseguradora?.trim() || null,
        tipo_vinculacion: rawValues.tipo_vinculacion || null,
        es_menor_de_edad: rawValues.es_menor_de_edad,
        acompanante: {
          nombre: rawValues.acompanante.nombre?.trim() || null,
          telefono: rawValues.acompanante.telefono?.trim() || null,
        },
        persona_responsable: {
          nombre: rawValues.persona_responsable.nombre?.trim() || null,
          telefono: rawValues.persona_responsable.telefono?.trim() || null,
          parentesco: rawValues.persona_responsable.parentesco?.trim() || null,
        },
        recomendaciones: rawValues.recomendaciones?.trim() || undefined,
      };

      this.historialService.updatePatient(cedula, payload).subscribe({
        next: (updated) => {
          this.isSaving.set(false);
          this.successMessage.set('Datos actualizados exitosamente.');
          this.saved.emit(updated);
          this.dialogRef?.close(updated);
        },
        error: (err) => {
          this.isSaving.set(false);
          const msg =
            err?.error?.message ||
            err?.message ||
            'Error al actualizar el paciente.';
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
