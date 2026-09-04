import {
  Component,
  ChangeDetectionStrategy,
  input,
  signal,
  computed,
  output,
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
  MedicalProcedureOption,
} from '../../../models/appointment-steps.models';

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
   * Horarios y turnos disponibles para selección
   */
  readonly dates = input<AvailableDate[]>([]);

  /**
   * Evento emitido al confirmar el agendamiento
   */
  readonly submitAppointment = output<void>();

  /**
   * Fecha u horario seleccionado por el usuario
   */
  readonly selectedDateId = signal<string | null>(null);

  /**
   * Control local para búsqueda y autocompletado de procedimiento
   */
  readonly searchControl = new FormControl<string>('');

  /**
   * Catálogo de procedimientos médicos disponibles
   */
  readonly procedureCatalog = signal<MedicalProcedureOption[]>([
    {
      id: 'proc-1',
      nombre: 'Limpieza Dental Profunda y Profilaxis',
      duracion: '45 min',
      especialidad: 'Odontología General',
    },
    {
      id: 'proc-2',
      nombre: 'Extracción Simple o Quirúrgica',
      duracion: '60 min',
      especialidad: 'Cirugía Oral',
    },
    {
      id: 'proc-3',
      nombre: 'Valoración y Consulta de Ortodoncia',
      duracion: '30 min',
      especialidad: 'Ortodoncia',
    },
    {
      id: 'proc-4',
      nombre: 'Blanqueamiento Dental LED',
      duracion: '60 min',
      especialidad: 'Estética Dental',
    },
    {
      id: 'proc-5',
      nombre: 'Endodoncia y Tratamiento de Conductos',
      duracion: '90 min',
      especialidad: 'Endodoncia',
    },
  ]);

  /**
   * Filtro computado puro para autocompletar
   */
  readonly filteredProcedures = computed(() => {
    const filterValue = (this.searchControl.value || '').toLowerCase();
    return this.procedureCatalog().filter(
      (p) =>
        p.nombre.toLowerCase().includes(filterValue) ||
        p.especialidad.toLowerCase().includes(filterValue)
    );
  });

  onProcedureSelected(event: MatAutocompleteSelectedEvent): void {
    const selected = event.option.value as MedicalProcedureOption;
    this.searchControl.setValue(selected.nombre);
    this.form().get('procedimientoId')?.setValue(selected.id);
    this.form().get('procedimientoId')?.markAsDirty();
  }

  selectDate(slot: AvailableDate): void {
    this.selectedDateId.set(slot.id);
  }

  confirm(): void {
    if (this.form().valid) {
      this.submitAppointment.emit();
    }
  }
}
