import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
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
import {
  StepCedulaComponent,
  StepPersonalInfoComponent,
  StepProcedureSelectionComponent,
  AvailableDate,
  PatientHistory,
} from '@nx-boilerplate/layouts';

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

  readonly title = signal<string>('Formulario de Agendamiento');

  /**
   * Signals para el estado reactivo del paciente y citas
   */
  readonly patientHistory = signal<PatientHistory | null>(null);
  readonly availableDates = signal<AvailableDate[]>([]);

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
   * Simula la verificación de cédula y precarga datos del paciente
   */
  verifyCedula(): void {
    const cedula = this.step1Group.controls['cedula'].value;

    if (cedula === '123456') {
      this.patientHistory.set({
        cedula: '123456',
        nombreCompleto: 'Juan Pérez',
        ultimosProcedimientos: [
          {
            id: 'proc-1',
            nombre: 'Limpieza Dental Profunda',
            fecha: '2026-01-15',
            profesional: 'Dra. María Gómez',
          },
          {
            id: 'proc-2',
            nombre: 'Extracción Tercer Molar',
            fecha: '2025-11-20',
            profesional: 'Dr. Carlos Mendoza',
          },
          {
            id: 'proc-3',
            nombre: 'Revisión General Odontológica',
            fecha: '2025-08-10',
            profesional: 'Dra. María Gómez',
          },
        ],
        recomendaciones:
          'Paciente con sensibilidad dental leve. Requiere profilaxis cada 6 meses y control radiográfico anual.',
      });

      // Precarga automática en el formulario del paso 2
      this.step2Group.patchValue({
        nombre: 'Juan',
        apellidos: 'Pérez',
        correo: 'juan.perez@example.com',
        celular: '3001234567',
        recordatorioWhatsapp: true,
      });

      this.availableDates.set([
        {
          id: 'slot-1',
          fecha: '2026-09-10',
          hora: '09:00 AM',
          profesional: 'Dra. María Gómez',
          disponible: true,
        },
        {
          id: 'slot-2',
          fecha: '2026-09-10',
          hora: '10:30 AM',
          profesional: 'Dra. María Gómez',
          disponible: true,
        },
        {
          id: 'slot-3',
          fecha: '2026-09-11',
          hora: '02:00 PM',
          profesional: 'Dr. Carlos Mendoza',
          disponible: true,
        },
      ]);
    } else {
      this.patientHistory.set(null);
      this.availableDates.set([]);
    }
  }

  onAppointmentSubmitted(): void {
    console.log('Cita confirmada con éxito:', this.form.value);
  }
}
