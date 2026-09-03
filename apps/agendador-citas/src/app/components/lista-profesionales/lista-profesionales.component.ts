import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-lista-profesionales',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lista-profesionales.component.html',
  styleUrl: './lista-profesionales.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListaProfesionalesComponent {
  readonly title = signal<string>('Directorio de Profesionales');
}
