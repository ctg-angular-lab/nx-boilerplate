export const PROCEDIMIENTOS_TABS = {
  LIST: 1,
  FORM: 2,
} as const;

export type ProcedimientosTabId =
  (typeof PROCEDIMIENTOS_TABS)[keyof typeof PROCEDIMIENTOS_TABS];
