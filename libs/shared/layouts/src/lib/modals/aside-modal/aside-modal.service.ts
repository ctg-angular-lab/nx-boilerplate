import { inject, Injectable } from '@angular/core';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { AsideModalComponent } from './aside-modal.component';
import { AsideModalData } from '../models/aside-modal.models';

@Injectable({
  providedIn: 'root',
})
export class AsideModalService {
  private readonly dialog = inject(MatDialog);

  open<TComponent = unknown, TInputs extends Record<string, unknown> = Record<string, unknown>, TResult = boolean>(
    data: AsideModalData<TComponent, TInputs>,
    config?: Partial<MatDialogConfig<AsideModalData<TComponent, TInputs>>>
  ): MatDialogRef<AsideModalComponent, TResult> {
    const customPanelClasses = Array.isArray(config?.panelClass)
      ? config.panelClass
      : config?.panelClass
      ? [config.panelClass]
      : [];

    const dialogConfig: MatDialogConfig<AsideModalData<TComponent, TInputs>> = {
      position: { right: '0', top: '0', bottom: '0' },
      height: '100vh',
      maxHeight: '100vh',
      width: config?.width ?? '480px',
      maxWidth: config?.maxWidth ?? '100vw',
      panelClass: ['aside-modal-panel', ...customPanelClasses],
      autoFocus: false,
      data,
      ...config,
    };

    return this.dialog.open(AsideModalComponent, dialogConfig);
  }
}
