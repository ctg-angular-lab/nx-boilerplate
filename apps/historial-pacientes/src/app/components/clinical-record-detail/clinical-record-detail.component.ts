import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { ICitaMedica, IPatientHistory } from '@nx-boilerplate/api-interfaces';

@Component({
  selector: 'app-clinical-record-detail',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
  ],
  templateUrl: './clinical-record-detail.component.html',
  styleUrl: './clinical-record-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClinicalRecordDetailComponent {
  private readonly dialogRef = inject(MatDialogRef, { optional: true });

  // --- Inputs obligatorios ---
  readonly record = input.required<ICitaMedica>();
  readonly patient = input.required<IPatientHistory>();
  readonly doctorName = input<string>('');

  // --- Outputs ---
  readonly closed = output<void>();

  // --- Computeds de formato ---
  readonly firstDoctor = computed(() => this.record().medico_tratante?.[0]);

  readonly fechaAtencion = computed(() => {
    const raw = this.firstDoctor()?.fecha_atencion;
    if (raw instanceof Date) {
      return raw.toISOString().split('T')[0];
    }
    return raw || 'Sin fecha registrada';
  });

  readonly isCompletada = computed(
    () => this.record().estado_registro === 'COMPLETADA'
  );

  onClose(): void {
    this.closed.emit();
    this.dialogRef?.close(null);
  }
}

