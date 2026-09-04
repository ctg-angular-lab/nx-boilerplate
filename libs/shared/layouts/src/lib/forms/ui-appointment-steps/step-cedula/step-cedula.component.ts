import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'lib-step-cedula, app-step-cedula',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
  ],
  templateUrl: './step-cedula.component.html',
  styleUrl: './step-cedula.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepCedulaComponent {
  /**
   * Sub-grupo reactivo del formulario correspondiente al paso 1
   */
  readonly stepForm = input.required<FormGroup>();

  get cedulaControl(): AbstractControl | null {
    return this.stepForm().get('cedula');
  }

  hasError(errorType: string): boolean {
    const ctrl = this.cedulaControl;
    return !!(ctrl && ctrl.hasError(errorType) && (ctrl.dirty || ctrl.touched));
  }
}
