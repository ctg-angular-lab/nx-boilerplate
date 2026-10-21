import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'lib-step-professional-info',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './step-professional-info.component.html',
  styleUrl: './step-professional-info.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepProfessionalInfoComponent {
  readonly stepForm = input.required<FormGroup>();

  readonly nextStep = output<void>();
  readonly prevStep = output<void>();

  hasError(field: string, error: string): boolean {
    const control = this.stepForm().get(field);
    return !!(control && control.hasError(error) && (control.dirty || control.touched));
  }
}
