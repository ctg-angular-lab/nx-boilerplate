import {
  Component,
  ChangeDetectionStrategy,
  DestroyRef,
  inject,
  signal,
  computed,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatStepperModule } from '@angular/material/stepper';
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
  ICreateAppointmentRequest,
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
  private readonly appointmentLogic = inject(AppointmentLogicService);
  private readonly destroyRef = inject(DestroyRef);

  readonly title = signal<string>('Formulario de Agendamiento');

  /**
   * FormGroup fuertemente tipado con 3 sub-grupos
   */
  readonly form = this.fb.group({
    step1: this.fb.group({
      cedula: ['', [Validators.required, Validators.pattern(/^[0-9]+$/)]],
    }),
    step2: this.fb.group({
      nombre: ['', [Validators.required]],
      apellidos: ['', [Validators.required]],
      correo: ['', [Validators.required, Validators.email]],
      celular: ['', [Validators.required]],
      recordatorioWhatsapp: [false],
    }),
    step3: this.fb.group({
      procedimientoId: ['', [Validators.required]],
    }),
  });

  /**
   * Getters tipados para acceso a los sub-grupos del formulario
   */
  get step1Group(): FormGroup {
    return this.form.controls.step1;
  }

  get step2Group(): FormGroup {
    return this.form.controls.step2;
  }

  get step3Group(): FormGroup {
    return this.form.controls.step3;
  }

  /**
   * Conexión directa con la Signal de historial de paciente gestionada por el servicio de dominio
   */
  readonly patientHistory = this.appointmentLogic.patientHistory;

  /**
   * Catálogo reactivo de procedimientos médicos cargados desde el backend
   */
  readonly procedures = this.appointmentLogic.procedures;

  /**
   * Señal nativa para las fechas disponibles (libre de toSignal y de problemas de Injection Context)
   */
  readonly availableDates = signal<AvailableDate[]>([]);

  /**
   * Médicos profesionales asignados al procedimiento seleccionado
   */
  readonly procedureDoctors = signal<IProfessionalSummary[]>([]);

  /**
   * Indica si la consulta de doctores del procedimiento ha finalizado
   */
  readonly doctorsLoaded = signal<boolean>(false);

  /**
   * Información consolidada del paciente del Paso 2 para el mensaje de lista de espera
   */
  readonly patientInfo = computed(() => {
    const rawStep2 = this.step2Group.getRawValue();
    return {
      nombre: rawStep2.nombre || this.patientHistory()?.nombre || '',
      apellidos: rawStep2.apellidos || this.patientHistory()?.apellidos || '',
    };
  });

  constructor() {
    // Sincronización reactiva con Signals: auto-llenado del Paso 2
    effect(() => {
      const patient = this.patientHistory();
      if (patient) {
        this.step2Group.patchValue({
          nombre: patient.nombre ?? '',
          apellidos: patient.apellidos ?? '',
          correo: patient.correo ?? '',
          celular: patient.celular ?? '',
        });
      }
    });

    // Escucha reactiva de selección de procedimiento: consulta los doctores asignados
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

    this.destroyRef.onDestroy(() => sub.unsubscribe());
  }

  /**
   * Dispara la verificación de la cédula ingresada en el paso 1
   */
  verifyCedula(): void {
    const cedula = this.step1Group.controls['cedula'].value;
    if (cedula) {
      this.appointmentLogic.verifyPatient(cedula);
    }
  }

  /**
   * Mapea el estado consolidado del formulario y envía la mutación para agendar la cita
   */
  submitAppointment(): void {
    if (this.form.invalid) {
      return;
    }

    const step1 = this.step1Group.getRawValue();
    const step2 = this.step2Group.getRawValue();
    const step3 = this.step3Group.getRawValue();

    const payload: ICreateAppointmentRequest = {
      cedula: step1.cedula ?? '',
      nombre: step2.nombre ?? '',
      apellidos: step2.apellidos ?? '',
      correo: step2.correo ?? '',
      celular: step2.celular ?? '',
      recordatorioWhatsapp: !!step2.recordatorioWhatsapp,
      procedimientoId: step3.procedimientoId ?? '',
    };

    this.appointmentLogic.createAppointment(payload).subscribe({
      next: () => {
        this.openConfirmationModal();
      },
      error: (error) => {
        console.error('Error al registrar la cita médica:', error);
      },
    });
  }

  /**
   * Orquesta la apertura del modal de confirmación con los datos dinámicos de la cita
   */
  openConfirmationModal(): void {
    const nombre = this.step2Group.get('nombre')?.value || '';
    const apellido = this.step2Group.get('apellidos')?.value || '';

    const modalData: ConfirmationModalData<boolean> = {
      title: 'Confirmación de cita',
      text: `Sr(a) ${nombre} ${apellido}, su solicitud de cita ha sido procesada exitosamente.`,
      actions: [
        { label: 'Aceptar', color: 'primary', value: true },
        { label: 'Cerrar', color: 'default', value: false },
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
        console.log('Modal cerrado tras confirmación');
      }
    });
  }

  /**
   * Manejador del submit emitido desde el paso 3 del Stepper
   */
  onAppointmentSubmitted(): void {
    this.submitAppointment();
  }

  /**
   * Manejador de la acción de unirse a la lista de espera
   */
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

  /**
   * Navega hacia el calendario contextualizando la selección de profesional, paciente y procedimiento
   */
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
      celular: step2.celular?.trim() || '',
    };

    this.appointmentLogic.startBookingFlow({
      patient,
      procedure,
      doctor,
    });
  }
}

