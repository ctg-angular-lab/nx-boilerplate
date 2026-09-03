import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NxWelcome } from './nx-welcome';

@Component({
  imports: [NxWelcome],
  selector: 'app-Login-entry',
  template: `<app-nx-welcome></app-nx-welcome>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RemoteEntry {}
