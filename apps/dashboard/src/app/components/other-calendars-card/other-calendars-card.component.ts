import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { IDashboardDoctor } from '../../models/dashboard.models';

@Component({
  selector: 'app-other-calendars-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
  ],
  templateUrl: './other-calendars-card.component.html',
  styleUrl: './other-calendars-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OtherCalendarsCardComponent {
  /**
   * Lista de profesionales médicos excluyendo al médico activo
   */
  readonly doctors = input.required<readonly IDashboardDoctor[]>();

  /**
   * Cédulas de los médicos actualmente seleccionados para comparación
   */
  readonly selectedCedulas = input.required<readonly string[]>();

  /**
   * Notifica cuando se conmuta un médico
   */
  readonly toggleDoctor = output<string>();

  /**
   * Notifica cuando se limpian todos los médicos seleccionados
   */
  readonly clearAll = output<void>();

  isChecked(cedula: string): boolean {
    return this.selectedCedulas().includes(cedula);
  }

  onToggle(cedula: string): void {
    this.toggleDoctor.emit(cedula);
  }

  onClear(): void {
    this.clearAll.emit();
  }
}

