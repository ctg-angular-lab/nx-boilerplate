import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-historial-pacientes-entry',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './remote-entry.component.html',
  styleUrl: './remote-entry.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RemoteEntryComponent {}

