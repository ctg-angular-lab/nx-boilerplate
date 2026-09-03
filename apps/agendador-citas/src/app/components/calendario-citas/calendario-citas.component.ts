import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-calendario-citas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calendario-citas.component.html',
  styleUrl: './calendario-citas.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarioCitasComponent {
  readonly title = signal<string>('Calendario de Citas Programadas');
}
