import {
  Component,
  ChangeDetectionStrategy,
  DestroyRef,
  inject,
  signal,
  computed,
  effect,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { filter, switchMap } from 'rxjs';
import {
  StepCedulaComponent,
  StepPersonalInfoComponent,
  StepProcedureSelectionComponent,
  ConfirmationModalComponent,
  ConfirmationModalData,
  AvailableDate,
} from '@nx-boilerplate/layouts';
import {
  IBookingPatient,
  ICreatePatientRequest,
  IProfessionalSummary,
} from '@nx-boilerplate/api-interfaces';
import { AppointmentLogicService } from '../../services/appointment-logic.service';

@Component({
  selector: 'app-agendar-cita',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatStepperModule,
    MatButtonModule,
    MatIconModule,
    StepCedulaComponent,
    StepPersonalInfoComponent,
    StepProcedureSelectionComponent,
  ],
  templateUrl: './agendar-cita.component.html',
  styleUrl: './agendar-cita.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgendarCitaComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  public readonly appointmentLogic = inject(AppointmentLogicService);
  private readonly destroyRef = inject(DestroyRef);
  readonly title = signal<string>('Formulario de Agendamiento');
  readonly stepper = viewChild.required(MatStepper);
  readonly isSubmittingPatient = signal<boolean>(false);
  readonly form = this.fb.group({
    step1: this.fb.group({
      cedula: ['', [Validators.required, Validators.pattern(/^[0-9]+$/)]],
    }),
    step2: this.fb.group({
      nombre: ['', [Validators.required]],
      apellidos: ['', [Validators.required]],
      correo: ['', [Validators.required, Validators.email]],
      indicativo: ['+57', [Validators.required]],
      numeroCelular: ['', [Validators.required, Validators.pattern(/^3\d{9}$/)]],
      recordatorioWhatsapp: [false],
    }),
    step3: this.fb.group({
      procedimientoId: ['', [Validators.required]],
    }),
  });
  get step1Group(): FormGroup {
    return this.form.controls.step1;
  }
  get step2Group(): FormGroup {
    return this.form.controls.step2;
  }
  get step3Group(): FormGroup {
    return this.form.controls.step3;
  }
  readonly patientHistory = this.appointmentLogic.patientHistory;
  readonly procedures = this.appointmentLogic.procedures;
  readonly availableDates = signal<AvailableDate[]>([]);
  readonly procedureDoctors = signal<IProfessionalSummary[]>([]);
  readonly doctorsLoaded = signal<boolean>(false);
  readonly patientInfo = computed(() => {
    const rawStep2 = this.step2Group.getRawValue();
    return {
      nombre: rawStep2.nombre || this.patientHistory()?.nombre || '',
      apellidos: rawStep2.apellidos || this.patientHistory()?.apellidos || '',
    };
  });

  constructor() {
    this.appointmentLogic.fetchAreaCodes();

    effect(() => {
      const patient = this.patientHistory();
      if (patient) {
        let indicativo = '+57';
        let numeroCelular = patient.celular?.trim() ?? '';

        const areaCodes = this.appointmentLogic.areaCodes();
        const matched = areaCodes.find((a) => numeroCelular.startsWith(a.code));
        if (matched) {
          indicativo = matched.code;
          numeroCelular = numeroCelular.slice(matched.code.length);
        } else if (numeroCelular.startsWith('+')) {
          const match = numeroCelular.match(/^(\+\d{1,4})(.*)$/);
          if (match) {
            indicativo = match[1];
            numeroCelular = match[2];
          }
        }

        this.step2Group.patchValue({
          nombre: patient.nombre ?? '',
          apellidos: patient.apellidos ?? '',
          correo: patient.correo ?? '',
          indicativo,
          numeroCelular,
        });
      } else {
        this.step2Group.reset({
          nombre: '',
          apellidos: '',
          correo: '',
          indicativo: '+57',
          numeroCelular: '',
          recordatorioWhatsapp: false,
        });
        this.step2Group.markAsPristine();
        this.step2Group.markAsUntouched();
        const step2 = this.stepper()?.steps?.get(1);
        if (step2) {
          step2.interacted = false;
        }
      }
    });

    const indicativoSub = this.form.controls.step2.controls.indicativo.valueChanges
      .subscribe((code) => {
        const areaCodes = this.appointmentLogic.areaCodes();
        const selected = areaCodes.find((a) => a.code === code);
        const pattern = selected?.patternString ?? selected?.pattern;

        if (pattern) {
          try {
            const regex = new RegExp(pattern);
            this.form.controls.step2.controls.numeroCelular.setValidators([
              Validators.required,
              Validators.pattern(regex),
            ]);
          } catch (e) {
            console.error('Error al compilar regex de código de área:', e);
            this.form.controls.step2.controls.numeroCelular.setValidators([Validators.required]);
          }
        } else {
          this.form.controls.step2.controls.numeroCelular.setValidators([Validators.required]);
        }
        this.form.controls.step2.controls.numeroCelular.updateValueAndValidity();
      });

    const sub = this.form.controls.step3.controls.procedimientoId.valueChanges
      .pipe(
        filter((id): id is string => typeof id === 'string' && id.trim().length > 0),
        switchMap((id) => {
          this.doctorsLoaded.set(false);
          return this.appointmentLogic.getProcedureDoctors(id);
        })
      )
      .subscribe((doctors) => {
        this.procedureDoctors.set(doctors);
        this.doctorsLoaded.set(true);
        console.log('Doctores asignados al procedimiento:', doctors);
      });

    const successSub = this.appointmentLogic.bookingSuccess$.subscribe(() => {
      this.form.reset({
        step2: {
          indicativo: '+57',
          recordatorioWhatsapp: false,
        },
      });
      this.procedureDoctors.set([]);
      this.doctorsLoaded.set(false);
      this.stepper()?.reset();
    });

    this.destroyRef.onDestroy(() => {
      indicativoSub.unsubscribe();
      sub.unsubscribe();
      successSub.unsubscribe();
    });
  }

  verifyCedula(): void {
    const cedula = this.step1Group.controls['cedula'].value;
    if (cedula) {
      this.step2Group.reset({
        nombre: '',
        apellidos: '',
        correo: '',
        indicativo: '+57',
        numeroCelular: '',
        recordatorioWhatsapp: false,
      });
      this.step2Group.markAsPristine();
      this.step2Group.markAsUntouched();
      const step2 = this.stepper()?.steps?.get(1);
      if (step2) {
        step2.interacted = false;
      }
      this.appointmentLogic.verifyPatient(cedula);
    }
  }


  onStep2Submit(): void {
    if (this.form.controls.step2.invalid) {
      this.form.controls.step2.markAllAsTouched();
      return;
    }

    if (!this.appointmentLogic.isNewPatient()) {
      this.stepper().next();
      return;
    }

    const cedula = this.step1Group.controls['cedula'].value?.trim() || '';
    const step2Values = this.step2Group.getRawValue();
    const celularCompleto = `${step2Values.indicativo?.trim() || ''}${step2Values.numeroCelular?.trim() || ''}`.trim();

    const patientData: ICreatePatientRequest = {
      cedula,
      nombre: step2Values.nombre?.trim() || '',
      apellidos: step2Values.apellidos?.trim() || '',
      correo: step2Values.correo?.trim() || '',
      celular: celularCompleto,
      ultimosProcedimientos: [],
      recomendaciones: '',
    };

    this.isSubmittingPatient.set(true);
    this.appointmentLogic.createPatient(patientData).subscribe({
      next: () => {
        this.isSubmittingPatient.set(false);
        this.stepper().next();
      },
      error: (error) => {
        this.isSubmittingPatient.set(false);
        console.error('Error al registrar nuevo paciente:', error);
      },
    });
  }

  onWaitlistRequested(): void {
    const nombre = this.step2Group.get('nombre')?.value || '';
    const apellido = this.step2Group.get('apellidos')?.value || '';

    const modalData: ConfirmationModalData<boolean> = {
      title: 'Lista de Espera',
      text: `Sr(a) ${nombre} ${apellido}, ¿desea registrarse en la lista de espera? Le notificaremos automáticamente cuando se libere un turno.`,
      actions: [
        { label: 'Unirme a la lista', color: 'primary', value: true },
        { label: 'Cancelar', color: 'default', value: false },
      ],
    };

    const dialogRef = this.dialog.open<
      ConfirmationModalComponent,
      ConfirmationModalData<boolean>,
      boolean
    >(ConfirmationModalComponent, {
      data: modalData,
      width: '450px',
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        console.log('Paciente registrado en lista de espera');
      }
    });
  }

  onViewCalendar(doctor: IProfessionalSummary): void {
    const step1 = this.step1Group.getRawValue();
    const step2 = this.step2Group.getRawValue();
    const step3 = this.step3Group.getRawValue();
    const procId = step3.procedimientoId;

    const procedure = this.procedures().find(
      (p) => p.idProcedimiento === procId || (p as unknown as { id?: string }).id === procId
    );
    if (!procedure) return;

    const patient: IBookingPatient = {
      cedula: step1.cedula?.trim() || '',
      nombre: step2.nombre?.trim() || '',
      apellidos: step2.apellidos?.trim() || '',
      correo: step2.correo?.trim() || '',
      celular: `${step2.indicativo?.trim() || ''}${step2.numeroCelular?.trim() || ''}`.trim(),
    };

    this.appointmentLogic.startBookingFlow({
      patient,
      procedure,
      doctor,
    });
  }
}

