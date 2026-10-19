import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-lista-profesionales-entry',
  standalone: true,
  imports: [],
  template: `
    <div class="remote-entry-container">
      <h2>Módulo de Lista de Profesionales</h2>
    </div>
  `,
  styles: `
    .remote-entry-container {
      padding: 1.5rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RemoteEntryComponent {}
