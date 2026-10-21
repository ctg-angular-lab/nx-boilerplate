import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { IProcedure } from '@nx-boilerplate/api-interfaces';

export interface ProfessionalSummaryData {
  cedula: string;
  nombres: string;
  apellidos: string;
  email: string;
  profesion: string;
  diasLaborales: string[];
  horaInicio: string;
  horaFin: string;
  receso?: string | null;
}

@Component({
  selector: 'lib-step-professional-procedures',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './step-professional-procedures.component.html',
  styleUrl: './step-professional-procedures.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepProfessionalProceduresComponent {
  readonly stepForm = input.required<FormGroup>();
  readonly procedures = input<IProcedure[]>([]);
  readonly summaryData = input<ProfessionalSummaryData | null>(null);
  readonly isSaving = input<boolean>(false);
  readonly isEditMode = input<boolean>(false);

  readonly prevStep = output<void>();
  readonly save = output<void>();
}
