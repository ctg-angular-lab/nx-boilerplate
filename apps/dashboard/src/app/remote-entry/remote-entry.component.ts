import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-dashboard-entry',
  standalone: true,
  templateUrl: './remote-entry.component.html',
  styleUrl: './remote-entry.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RemoteEntryComponent {}

