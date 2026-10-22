export const PROFESIONALES_TABS = {
  LIST: 1,
  FORM: 2,
} as const;

export type ProfesionalesTabId =
  (typeof PROFESIONALES_TABS)[keyof typeof PROFESIONALES_TABS];

export const DIAS_LABORALES = [
  'LUNES',
  'MARTES',
  'MIERCOLES',
  'JUEVES',
  'VIERNES',
  'SABADO',
] as const;

export type DiaLaboral = (typeof DIAS_LABORALES)[number];
