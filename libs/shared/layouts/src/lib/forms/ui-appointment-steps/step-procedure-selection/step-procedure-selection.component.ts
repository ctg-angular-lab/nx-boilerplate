import {
  Component,
  ChangeDetectionStrategy,
  effect,
  input,
  computed,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  AvailableDate,
} from '../../../models/appointment-steps.models';
import { IProcedure, IProfessionalSummary } from '@nx-boilerplate/api-interfaces';

@Component({
  selector: 'lib-step-procedure-selection, app-step-procedure-selection',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './step-procedure-selection.component.html',
  styleUrl: './step-procedure-selection.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepProcedureSelectionComponent {
  /**
   * Sub-grupo del formulario del paso 3
   */
  readonly form = input.required<FormGroup>();

  /**
   * Catálogo de procedimientos médicos reales desde MongoDB Atlas
   */
  readonly procedures = input<IProcedure[]>([]);

  /**
   * Médicos profesionales asignados al procedimiento
   */
  readonly doctors = input<IProfessionalSummary[]>([]);

  /**
   * Indica si la consulta de doctores ha finalizado
   */
  readonly doctorsLoaded = input<boolean>(false);

  /**
   * Información del paciente para el mensaje personalizado de lista de espera
   */
  readonly patientInfo = input<{ nombre: string; apellidos: string } | null>(null);

  /**
   * Horarios y turnos disponibles para selección
   */
  readonly dates = input<AvailableDate[]>([]);

  /**
   * Evento emitido al confirmar el agendamiento
   */
  readonly submitAppointment = output<void>();

  /**
   * Evento emitido al unirse a la lista de espera
   */
  readonly joinWaitlist = output<void>();

  /**
   * Evento emitido al pulsar 'Ver calendario' sobre un profesional específico
   */
  readonly viewCalendar = output<IProfessionalSummary>();

  /**
   * Control local para búsqueda y autocompletado de procedimiento
   */
  readonly searchControl = new FormControl<string>('');

  /**
   * Id del procedimiento seleccionado, sincronizado reactivamente con el control del formulario
   * (incluye selecciones programáticas, p. ej. cita de control preseleccionada)
   */
  readonly #selectedProcedureId = signal<string | null>(null);

  constructor() {
    effect((onCleanup) => {
      const control = this.form().get('procedimientoId');
      if (!control) return;

      const procedures = this.procedures();
      const sync = (id: unknown): void => {
        const procId = typeof id === 'string' && id ? id : null;
        this.#selectedProcedureId.set(procId);
        const found = procedures.find((p) => p.idProcedimiento === procId);
        if (found && this.searchControl.value !== found.nombreProcedimiento) {
          this.searchControl.setValue(found.nombreProcedimiento, { emitEvent: false });
        }
      };

      sync(control.value);
      const sub = control.valueChanges.subscribe((id) => {
        sync(id);
        if (!id && this.searchControl.value) {
          this.searchControl.setValue('', { emitEvent: false });
        }
      });
      onCleanup(() => sub.unsubscribe());
    });
  }

  /**
   * Nombre del procedimiento seleccionado actualmente
   */
  readonly selectedProcedureName = computed(() => {
    const procId = this.#selectedProcedureId();
    const found = this.procedures().find((p) => p.idProcedimiento === procId);
    return found ? found.nombreProcedimiento : (this.searchControl.value || '');
  });

  /**
   * Mensaje dinámico para la lista de espera cuando no hay profesionales disponibles
   */
  readonly waitlistMessage = computed(() => {
    const procName = this.selectedProcedureName();
    const patient = this.patientInfo();
    const nombre = patient?.nombre ?? '';
    const apellidos = patient?.apellidos ?? '';
    return `Se consultará con los profesionales disponibles pueden realizar el procedimiento ${procName} y se agendará llamada al paciente ${nombre} ${apellidos}`.trim();
  });

  /**
   * Filtro computado puro para autocompletar contra el catálogo de procedimientos
   */
  readonly filteredProcedures = computed(() => {
    const filterValue = (this.searchControl.value || '').toLowerCase().trim();
    return this.procedures().filter((p) =>
      p.nombreProcedimiento.toLowerCase().includes(filterValue)
    );
  });

  onProcedureSelected(event: MatAutocompleteSelectedEvent): void {
    const selected = event.option.value as IProcedure;
    this.searchControl.setValue(selected.nombreProcedimiento);
    this.form().get('procedimientoId')?.setValue(selected.idProcedimiento);
    this.form().get('procedimientoId')?.markAsDirty();
  }

  onJoinWaitlist(): void {
    this.joinWaitlist.emit();
  }
}
