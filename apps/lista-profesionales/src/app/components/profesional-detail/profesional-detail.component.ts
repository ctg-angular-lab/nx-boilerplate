import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogRef } from '@angular/material/dialog';
import { IActiveProfessional } from '@nx-boilerplate/api-interfaces';

@Component({
  selector: 'app-profesional-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
  ],
  templateUrl: './profesional-detail.component.html',
  styleUrl: './profesional-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfesionalDetailComponent {
  readonly professional = input.required<IActiveProfessional>();
  readonly relatedProcedureNames = input<string[]>([]);

  readonly dialogRef = inject(MatDialogRef, { optional: true });

  onClose(): void {
    this.dialogRef?.close(false);
  }
}
