import { Type } from '@angular/core';

export interface AsideModalData<TComponent = unknown, TInputs extends Record<string, unknown> = Record<string, unknown>> {
  title?: string;
  component: Type<TComponent>;
  inputs?: TInputs;
  cancelText?: string;
  confirmText?: string;
  showActions?: boolean;
  showCloseIcon?: boolean;
}
