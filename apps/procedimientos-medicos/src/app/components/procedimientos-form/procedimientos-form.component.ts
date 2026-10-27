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
import {
  FormArray,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import {
  ICreateProcedureRequest,
  IProcedure,
  IUpdateProcedureRequest,
} from '@nx-boilerplate/api-interfaces';
import {
  ProcedureSummaryData,
  StepProcedureNameComponent,
  StepProcedurePricingComponent,
  StepProcedureSummaryComponent,
} from '@nx-boilerplate/layouts';
import { ProcedimientosAdminService } from '../../services/procedimientos-admin.service';

@Component({
  selector: 'app-procedimientos-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatStepperModule,
    MatButtonModule,
    MatIconModule,
    StepProcedureNameComponent,
    StepProcedurePricingComponent,
    StepProcedureSummaryComponent,
  ],
  templateUrl: './procedimientos-form.component.html',
  styleUrl: './procedimientos-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProcedimientosFormComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  public readonly procedimientosService = inject(ProcedimientosAdminService);

  readonly stepper = viewChild<MatStepper>('stepper');

  readonly form = this.fb.group({
    step1: this.fb.group({
      nombreProcedimiento: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(100),
        ],
      ],
    }),
    step2: this.fb.group({
      valorStandar: [
        null as number | null,
        [Validators.required, Validators.min(0)],
      ],
      duracionStandar: [
        null as number | null,
        [Validators.required, Validators.min(5), Validators.max(480)],
      ],
      tieneLaboratorio: [false],
      laboratorios: this.fb.array<FormGroup>([]),
    }),
  });

  get laboratoriosArray(): FormArray<FormGroup> {
    return this.form.controls.step2.controls.laboratorios as FormArray<FormGroup>;
  }

  readonly summaryData = signal<ProcedureSummaryData | null>(null);

  private lastEditingId: string | null = null;

  constructor() {
    this.updateSummary();

    // Sincronizar reactividad de tieneLaboratorio para agregar/limpiar FormArray
    this.form.controls.step2.controls.tieneLaboratorio.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((enabled) => {
        if (enabled && this.laboratoriosArray.length === 0) {
          this.onAddLaboratory();
        } else if (!enabled) {
          this.laboratoriosArray.clear();
        }
        this.updateSummary();
      });

    // Actualizar el resumen ante cambios en el formulario
    this.form.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.updateSummary();
      });

    // Sincronización con el estado de edición del SSOT
    effect(() => {
      const proc = this.procedimientosService.editingProcedure();

      untracked(() => {
        if (proc) {
          if (this.lastEditingId !== proc.idProcedimiento) {
            this.populateForEdit(proc);
          }
        } else {
          // Solo limpiamos el formulario si veníamos de un modo de edición activo
          if (this.lastEditingId !== null) {
            this.resetForm();
          }
        }
      });
    });
  }

  private createLabGroup(
    nombre = '',
    precio: number | null = null,
    medida = ''
  ): FormGroup {
    return this.fb.group({
      nombreLaboratorio: [nombre, [Validators.required, Validators.minLength(2)]],
      precio: [precio, [Validators.required, Validators.min(0)]],
      medidaPorUnidad: [medida, [Validators.required]],
    });
  }

  private updateSummary(): void {
    const raw = this.form.getRawValue();
    const tieneLab = raw.step2.tieneLaboratorio;
    const labsRaw = tieneLab
      ? (this.laboratoriosArray.getRawValue() as Array<{
          nombreLaboratorio: string;
          precio: number;
          medidaPorUnidad: string;
        }>)
      : [];

    this.summaryData.set({
      nombreProcedimiento: raw.step1.nombreProcedimiento?.trim() || '',
      valorStandar: Number(raw.step2.valorStandar ?? 0),
      duracionStandar: Number(raw.step2.duracionStandar ?? 0),
      laboratorios: labsRaw.map((l) => ({
        nombreLaboratorio: l.nombreLaboratorio?.trim() || '',
        precio: Number(l.precio ?? 0),
        medidaPorUnidad: l.medidaPorUnidad?.trim() || '',
      })),
    });
  }

  private populateForEdit(proc: IProcedure): void {
    this.lastEditingId = proc.idProcedimiento;

    this.form.controls.step1.patchValue({
      nombreProcedimiento: proc.nombreProcedimiento,
    });

    const tieneLab = (proc.laboratorios?.length ?? 0) > 0;
    this.form.controls.step2.patchValue({
      valorStandar: proc.valorStandar,
      duracionStandar: proc.duracionStandar,
      tieneLaboratorio: tieneLab,
    });

    this.laboratoriosArray.clear();
    proc.laboratorios?.forEach((lab) => {
      this.laboratoriosArray.push(
        this.createLabGroup(lab.nombreLaboratorio, lab.precio, lab.medidaPorUnidad)
      );
    });

    this.updateSummary();
  }

  public resetForm(): void {
    this.lastEditingId = null;
    this.form.reset({
      step1: { nombreProcedimiento: '' },
      step2: {
        valorStandar: null,
        duracionStandar: null,
        tieneLaboratorio: false,
      },
    });
    this.laboratoriosArray.clear();
    this.form.markAsPristine();
    this.form.markAsUntouched();
    this.stepper()?.reset();
    this.updateSummary();
  }

  onStep1Next(): void {
    if (this.form.controls.step1.invalid) {
      this.form.controls.step1.markAllAsTouched();
      return;
    }

    const nombre = this.form.controls.step1.controls.nombreProcedimiento.value?.trim();

    // Si estamos editando y el nombre no cambió, avanzamos directamente
    const currentEditing = this.procedimientosService.editingProcedure();
    if (
      this.procedimientosService.isEditMode() &&
      currentEditing &&
      currentEditing.nombreProcedimiento.trim().toLowerCase() === nombre.toLowerCase()
    ) {
      this.stepper()?.next();
      return;
    }

    // Regla de Negocio 3: Auto-recuperación de inactivos y bloqueo de homónimos activos
    const existing = this.procedimientosService.findExistingByName(nombre);
    if (existing) {
      if (existing.isActive !== false) {
        // Bloqueo de duplicado activo
        this.form.controls.step1.controls.nombreProcedimiento.setErrors({
          duplicateName: true,
        });
        this.form.controls.step1.controls.nombreProcedimiento.markAsTouched();
        return;
      } else {
        // Procedimiento inactivo encontrado: Auto-recuperación
        this.procedimientosService.startRestoreInactive(existing);
        this.populateForEdit(existing);
        this.stepper()?.next();
        return;
      }
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

  onStepPrev(): void {
    this.stepper()?.previous();
  }

  onAddLaboratory(): void {
    this.laboratoriosArray.push(this.createLabGroup());
    this.updateSummary();
  }

  onRemoveLaboratory(index: number): void {
    this.laboratoriosArray.removeAt(index);
    if (this.laboratoriosArray.length === 0) {
      // Si se eliminaron todos los insumos, se apaga el switch automáticamente
      this.form.controls.step2.controls.tieneLaboratorio.setValue(false, {
        emitEvent: false,
      });
    }
    this.updateSummary();
  }

  onCancel(): void {
    this.resetForm();
    this.procedimientosService.goToList();
  }

  onSubmit(): void {
    if (this.form.invalid || this.procedimientosService.isSaving()) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const tieneLab = raw.step2.tieneLaboratorio;
    const laboratorios = tieneLab
      ? (this.laboratoriosArray.getRawValue() as Array<{
          nombreLaboratorio: string;
          precio: number;
          medidaPorUnidad: string;
        }>).map((l) => ({
          nombreLaboratorio: l.nombreLaboratorio.trim(),
          precio: Number(l.precio),
          medidaPorUnidad: l.medidaPorUnidad.trim(),
        }))
      : [];

    const basePayload: ICreateProcedureRequest = {
      nombreProcedimiento: raw.step1.nombreProcedimiento.trim(),
      valorStandar: Number(raw.step2.valorStandar),
      duracionStandar: Number(raw.step2.duracionStandar),
      laboratorios,
    };

    const editingProc = this.procedimientosService.editingProcedure();

    if (this.procedimientosService.isRestoringInactive() && editingProc) {
      const updatePayload: IUpdateProcedureRequest = {
        ...basePayload,
        isActive: true,
      };
      this.procedimientosService
        .updateProcedimiento(editingProc.idProcedimiento, updatePayload)
        .subscribe((res) => {
          if (res) this.resetForm();
        });
    } else if (this.procedimientosService.isEditMode() && editingProc) {
      this.procedimientosService
        .updateProcedimiento(editingProc.idProcedimiento, basePayload)
        .subscribe((res) => {
          if (res) this.resetForm();
        });
    } else {
      this.procedimientosService
        .createProcedimiento(basePayload)
        .subscribe((res) => {
          if (res) this.resetForm();
        });
    }
  }
}
