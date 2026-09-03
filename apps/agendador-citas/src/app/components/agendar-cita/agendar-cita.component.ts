import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-agendar-cita',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './agendar-cita.component.html',
  styleUrl: './agendar-cita.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgendarCitaComponent {
  readonly title = signal<string>('Formulario de Agendamiento');
}
