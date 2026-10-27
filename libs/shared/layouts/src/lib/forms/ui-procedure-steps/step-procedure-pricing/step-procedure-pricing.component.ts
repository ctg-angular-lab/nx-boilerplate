import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormArray, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@Component({
  selector: 'lib-step-procedure-pricing',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './step-procedure-pricing.component.html',
  styleUrl: './step-procedure-pricing.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepProcedurePricingComponent {
  readonly stepForm = input.required<FormGroup>();
  readonly laboratoriosArray = input<FormArray<FormGroup>>();

  readonly addLaboratory = output<void>();
  readonly removeLaboratory = output<number>();
  readonly prevStep = output<void>();
  readonly nextStep = output<void>();

  get labs(): FormGroup[] {
    const formArray =
      this.laboratoriosArray() ??
      (this.stepForm().get('laboratorios') as FormArray<FormGroup>);
    return (formArray?.controls as FormGroup[]) ?? [];
  }

  hasError(field: string, error: string): boolean {
    const control = this.stepForm().get(field);
    return !!(control && control.hasError(error) && (control.dirty || control.touched));
  }

  hasLabError(labGroup: FormGroup, field: string, error: string): boolean {
    const control = labGroup.get(field);
    return !!(control && control.hasError(error) && (control.dirty || control.touched));
  }
}
