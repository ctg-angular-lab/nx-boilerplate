import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@Component({
  selector: 'lib-step-professional-schedule',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './step-professional-schedule.component.html',
  styleUrl: './step-professional-schedule.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepProfessionalScheduleComponent {
  readonly stepForm = input.required<FormGroup>();
  readonly availableDays = input<readonly string[]>([
    'LUNES',
    'MARTES',
    'MIERCOLES',
    'JUEVES',
    'VIERNES',
    'SABADO',
  ]);

  readonly nextStep = output<void>();
  readonly prevStep = output<void>();

  hasFieldError(field: string, error: string): boolean {
    const control = this.stepForm().get(field);
    return !!(control && control.hasError(error) && (control.dirty || control.touched));
  }

  hasLunchError(field: string, error: string): boolean {
    const control = this.stepForm().get('recesoAlmuerzo')?.get(field);
    return !!(control && control.hasError(error) && (control.dirty || control.touched));
  }

  hasLunchGroupError(error: string): boolean {
    const control = this.stepForm().get('recesoAlmuerzo');
    return !!(control && control.hasError(error));
  }
}
