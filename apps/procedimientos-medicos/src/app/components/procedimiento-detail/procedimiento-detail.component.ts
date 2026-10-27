import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogRef } from '@angular/material/dialog';
import { IProcedure } from '@nx-boilerplate/api-interfaces';

@Component({
  selector: 'app-procedimiento-detail',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
  ],
  templateUrl: './procedimiento-detail.component.html',
  styleUrl: './procedimiento-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProcedimientoDetailComponent {
  readonly procedure = input.required<IProcedure>();
  readonly relatedDoctorNames = input<string[]>([]);

  readonly dialogRef = inject(MatDialogRef, { optional: true });

  onClose(): void {
    this.dialogRef?.close(false);
  }
}
