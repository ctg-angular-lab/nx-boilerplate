import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule, NgComponentOutlet } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AsideModalData } from '../models/aside-modal.models';

@Component({
  selector: 'lib-aside-modal',
  standalone: true,
  imports: [
    CommonModule,
    NgComponentOutlet,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './aside-modal.component.html',
  styleUrl: './aside-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AsideModalComponent {
  readonly data = inject<AsideModalData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<AsideModalComponent>);

  close(): void {
    this.dialogRef.close(false);
  }

  confirm(): void {
    this.dialogRef.close(true);
  }
}
