import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { PatientHistory } from '../../../models/appointment-steps.models';

@Component({
  selector: 'lib-step-personal-info, app-step-personal-info',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatIconModule,
  ],
  templateUrl: './step-personal-info.component.html',
  styleUrl: './step-personal-info.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepPersonalInfoComponent {
  /**
   * Sub-grupo del formulario del paso 2
   */
  readonly form = input.required<FormGroup>();

  /**
   * Historial clínico del paciente verificado
   */
  readonly history = input<PatientHistory | null>(null);

  /**
   * Helpers para validación visual de errores
   */
  hasError(controlName: string, errorType: string): boolean {
    const control = this.form().get(controlName);
    return !!(
      control &&
      control.hasError(errorType) &&
      (control.dirty || control.touched)
    );
  }
}
