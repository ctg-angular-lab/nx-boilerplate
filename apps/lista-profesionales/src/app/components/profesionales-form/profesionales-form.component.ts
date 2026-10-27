import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import {
  IActiveProfessional,
  ICreateProfessionalRequest,
  IUpdateProfessionalRequest,
} from '@nx-boilerplate/api-interfaces';
import {
  ProfessionalSummaryData,
  StepCedulaComponent,
  StepProfessionalInfoComponent,
  StepProfessionalProceduresComponent,
  StepProfessionalScheduleComponent,
} from '@nx-boilerplate/layouts';
import { DiaLaboral } from '../../models/profesionales-nav.models';
import { ProfesionalesAdminService } from '../../services/profesionales-admin.service';
import { scheduleRangeValidator } from '../../utils/schedule.validator';

@Component({
  selector: 'app-profesionales-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatStepperModule,
    MatButtonModule,
    MatIconModule,
    StepCedulaComponent,
    StepProfessionalInfoComponent,
    StepProfessionalScheduleComponent,
    StepProfessionalProceduresComponent,
  ],
  templateUrl: './profesionales-form.component.html',
  styleUrl: './profesionales-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfesionalesFormComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  public readonly profesionalesService = inject(ProfesionalesAdminService);

  readonly stepper = viewChild<MatStepper>('stepper');

  readonly form = this.fb.group({
    step1: this.fb.group({
      cedula: ['', [Validators.required, Validators.pattern(/^\d{7,15}$/)]],
    }),
    step2: this.fb.group({
      nombres: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(60)]],
      apellidos: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(60)]],
      email: ['', [Validators.required, Validators.email]],
      profesion: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    }),
    step3: this.fb.group(
      {
        diasLaborales: [
          ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES'] as DiaLaboral[],
          [Validators.required],
        ],
        horaInicio: ['08:00', [Validators.required]],
        horaFin: ['17:00', [Validators.required]],
        tieneReceso: [false],
        recesoAlmuerzo: this.fb.group({
          inicio: ['12:00'],
          fin: ['13:00'],
        }),
      },
      { validators: [scheduleRangeValidator] }
    ),
    step4: this.fb.group({
      procedimientosRelacionados: [[] as string[]],
    }),
  });

  readonly summaryData = signal<ProfessionalSummaryData | null>(null);

  private lastEditingCedula: string | null = null;

  constructor() {
    this.updateSummary();

    // Sincronizar reactividad de tieneReceso para revalidar el grupo de horario
    this.form.controls.step3.controls.tieneReceso.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.form.controls.step3.updateValueAndValidity();
        this.updateSummary();
      });

    // Actualizar resumen en cambios del formulario
    this.form.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.updateSummary();
      });

    // Efecto de sincronización con el modo de edición del SSOT
    effect(() => {
      const prof = this.profesionalesService.editingProfessional();

      untracked(() => {
        if (prof) {
          if (this.lastEditingCedula !== prof.cedula) {
            this.populateForEdit(prof);
          }
        } else {
          // Solo limpiamos el formulario si veníamos de un modo de edición activo
          if (this.lastEditingCedula !== null) {
            this.resetForm();
          }
        }
      });
    });
  }

  private updateSummary(): void {
    const raw = this.form.getRawValue();
    const tieneReceso = raw.step3.tieneReceso;
    const recesoStr =
      tieneReceso && raw.step3.recesoAlmuerzo.inicio && raw.step3.recesoAlmuerzo.fin
        ? `${raw.step3.recesoAlmuerzo.inicio} – ${raw.step3.recesoAlmuerzo.fin}`
        : null;

    this.summaryData.set({
      cedula: raw.step1.cedula?.trim() || '',
      nombres: raw.step2.nombres?.trim() || '',
      apellidos: raw.step2.apellidos?.trim() || '',
      email: raw.step2.email?.trim() || '',
      profesion: raw.step2.profesion?.trim() || '',
      diasLaborales: raw.step3.diasLaborales || [],
      horaInicio: raw.step3.horaInicio || '',
      horaFin: raw.step3.horaFin || '',
      receso: recesoStr,
    });
  }

  private populateForEdit(prof: IActiveProfessional): void {
    this.lastEditingCedula = prof.cedula;

    this.form.controls.step1.patchValue({ cedula: prof.cedula });
    this.form.controls.step1.controls.cedula.disable({ emitEvent: false });

    this.form.controls.step2.patchValue({
      nombres: prof.nombres,
      apellidos: prof.apellidos,
      email: prof.email,
      profesion: prof.profesion,
    });

    const tieneReceso = !!prof.horarioTrabajo.recesoAlmuerzo;
    this.form.controls.step3.patchValue({
      diasLaborales:
        (prof.horarioTrabajo.diasLaborales as DiaLaboral[]) || [
          'LUNES',
          'MARTES',
          'MIERCOLES',
          'JUEVES',
          'VIERNES',
        ],
      horaInicio: prof.horarioTrabajo.horaInicio,
      horaFin: prof.horarioTrabajo.horaFin,
      tieneReceso,
      recesoAlmuerzo: {
        inicio: prof.horarioTrabajo.recesoAlmuerzo?.inicio || '12:00',
        fin: prof.horarioTrabajo.recesoAlmuerzo?.fin || '13:00',
      },
    });

    this.form.controls.step4.patchValue({
      procedimientosRelacionados: prof.procedimientosRelacionados || [],
    });

    this.updateSummary();
  }

  public resetForm(): void {
    this.lastEditingCedula = null;
    this.form.controls.step1.controls.cedula.enable({ emitEvent: false });
    this.form.reset({
      step1: { cedula: '' },
      step2: { nombres: '', apellidos: '', email: '', profesion: '' },
      step3: {
        diasLaborales: ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES'],
        horaInicio: '08:00',
        horaFin: '17:00',
        tieneReceso: false,
        recesoAlmuerzo: { inicio: '12:00', fin: '13:00' },
      },
      step4: { procedimientosRelacionados: [] },
    });
    this.form.markAsPristine();
    this.form.markAsUntouched();
    this.stepper()?.reset();
    this.updateSummary();
  }

  onStep1Next(): void {
    if (this.profesionalesService.isEditMode()) {
      this.stepper()?.next();
      return;
    }

    if (this.form.controls.step1.invalid) {
      this.form.controls.step1.markAllAsTouched();
      return;
    }

    const cedula = this.form.controls.step1.controls.cedula.value?.trim();
    const exists = this.profesionalesService
      .profesionalesList()
      .some((p) => p.cedula.trim() === cedula);

    if (exists) {
      this.form.controls.step1.controls.cedula.setErrors({ duplicateCedula: true });
      this.form.controls.step1.controls.cedula.markAsTouched();
      return;
    }

    this.stepper()?.next();
  }

  onStep2Next(): void {
    if (this.form.controls.step2.invalid) {
      this.form.controls.step2.markAllAsTouched();
      return;
    }
    this.stepper()?.next();
  }

  onStep3Next(): void {
    if (this.form.controls.step3.invalid) {
      this.form.controls.step3.markAllAsTouched();
      return;
    }
    this.stepper()?.next();
  }

  onStepPrev(): void {
    this.stepper()?.previous();
  }

  onCancel(): void {
    this.resetForm();
    this.profesionalesService.goToList();
  }

  onSubmit(): void {
    if (this.form.invalid || this.profesionalesService.isSaving()) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const tieneReceso = raw.step3.tieneReceso;
    const recesoAlmuerzo =
      tieneReceso && raw.step3.recesoAlmuerzo.inicio && raw.step3.recesoAlmuerzo.fin
        ? {
            inicio: raw.step3.recesoAlmuerzo.inicio.trim(),
            fin: raw.step3.recesoAlmuerzo.fin.trim(),
          }
        : undefined;

    const horarioTrabajo = {
      diasLaborales: raw.step3.diasLaborales,
      horaInicio: raw.step3.horaInicio.trim(),
      horaFin: raw.step3.horaFin.trim(),
      ...(recesoAlmuerzo ? { recesoAlmuerzo } : {}),
    };

    if (this.profesionalesService.isEditMode()) {
      const updatePayload: IUpdateProfessionalRequest = {
        nombres: raw.step2.nombres.trim(),
        apellidos: raw.step2.apellidos.trim(),
        email: raw.step2.email.trim(),
        profesion: raw.step2.profesion.trim(),
        horarioTrabajo,
        ...(raw.step4.procedimientosRelacionados.length > 0
          ? { procedimientosRelacionados: raw.step4.procedimientosRelacionados }
          : {}),
      };

      this.profesionalesService
        .updateProfesional(raw.step1.cedula.trim(), updatePayload)
        .subscribe((res) => {
          if (res) this.resetForm();
        });
    } else {
      const createPayload: ICreateProfessionalRequest = {
        cedula: raw.step1.cedula.trim(),
        nombres: raw.step2.nombres.trim(),
        apellidos: raw.step2.apellidos.trim(),
        email: raw.step2.email.trim(),
        profesion: raw.step2.profesion.trim(),
        horarioTrabajo,
        ...(raw.step4.procedimientosRelacionados.length > 0
          ? { procedimientosRelacionados: raw.step4.procedimientosRelacionados }
          : {}),
      };

      this.profesionalesService.createProfesional(createPayload).subscribe((res) => {
        if (res) this.resetForm();
      });
    }
  }
}
