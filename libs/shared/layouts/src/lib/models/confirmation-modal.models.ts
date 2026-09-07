export type ConfirmationModalActionColor = 'primary' | 'accent' | 'warn' | 'default';

export interface ConfirmationModalAction<T = unknown> {
  label: string;
  color: ConfirmationModalActionColor;
  icon?: string;
  value: T;
}

export interface ConfirmationModalData<T = unknown> {
  title: string;
  text: string;
  actions: ConfirmationModalAction<T>[];
}
