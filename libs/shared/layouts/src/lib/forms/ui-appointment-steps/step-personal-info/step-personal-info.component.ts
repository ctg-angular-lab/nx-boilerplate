import { Component, ChangeDetectionStrategy, input, output, Injectable } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, FormGroupDirective, NgForm, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { ErrorStateMatcher } from '@angular/material/core';
import { IAreaCode } from '@nx-boilerplate/api-interfaces';
import { PatientHistory } from '../../../models/appointment-steps.models';

@Injectable()
export class PersonalInfoErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = !!(form && form.submitted);
    return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted));
  }
}

@Component({
  selector: 'lib-step-personal-info, app-step-personal-info',
  standalone: true,
  providers: [
    { provide: ErrorStateMatcher, useClass: PersonalInfoErrorStateMatcher },
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatIconModule,
  ],
  templateUrl: './step-personal-info.component.html',
  styleUrl: './step-personal-info.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepPersonalInfoComponent {
  readonly form = input.required<FormGroup>();
  readonly history = input<PatientHistory | null>(null);
  readonly isNewPatient = input<boolean>(false);
  readonly areaCodes = input<IAreaCode[]>([]);
  readonly saveAndContinue = output<void>();

  hasError(controlName: string, errorType: string): boolean {
    const control = this.form().get(controlName);
    return !!(
      control &&
      control.hasError(errorType) &&
      (control.dirty || control.touched)
    );
  }

  getPhoneErrorMessage(): string {
    const code = this.form().get('indicativo')?.value;
    const selected = this.areaCodes().find((a) => a.code === code);
    return (
      selected?.errorMessage ||
      'Formato de teléfono celular no válido para el país seleccionado'
    );
  }
}
