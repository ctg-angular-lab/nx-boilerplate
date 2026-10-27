import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ProcedureSummaryData } from '../../../models/procedure-steps.models';

@Component({
  selector: 'lib-step-procedure-summary',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './step-procedure-summary.component.html',
  styleUrl: './step-procedure-summary.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepProcedureSummaryComponent {
  readonly summaryData = input.required<ProcedureSummaryData>();
  readonly isSaving = input<boolean>(false);
  readonly isEditMode = input<boolean>(false);
  readonly isRestoringInactive = input<boolean>(false);

  readonly prevStep = output<void>();
  readonly save = output<void>();

  formatCop(value: number | undefined): string {
    if (value === undefined || value === null) return '$ 0';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(value);
  }
}
