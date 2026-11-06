import { IActiveProfessional } from '@nx-boilerplate/api-interfaces';

/** Estados semánticos de un bloque horario en la grilla de 30 minutos */
export type DashboardSlotStatus =
  | 'CONFIRMED'
  | 'SCHEDULED'
  | 'BLOCKED'
  | 'LUNCH'
  | 'AVAILABLE'
  | 'OUT_OF_HOURS';

/** Paleta categórica determinista para diferenciar médicos en "Otros calendarios" y en la cascada */
export interface IDoctorColorTheme {
  readonly id: string;
  readonly label: string;
  readonly cssVar: string;
  readonly containerCssVar: string;
  readonly onContainerCssVar: string;
}

/** Paleta canónica de 5 temas para asignación secuencial o por hash */
export const DOCTOR_COLOR_THEMES: readonly IDoctorColorTheme[] = [
  {
    id: 'primary',
    label: 'Azul Corporativo',
    cssVar: 'var(--sys-color-primary)',
    containerCssVar: 'var(--sys-color-primary-container)',
    onContainerCssVar: 'var(--sys-color-on-primary-container)',
  },
  {
    id: 'tertiary',
    label: 'Turquesa Clínico',
    cssVar: 'var(--sys-color-tertiary)',
    containerCssVar: 'var(--sys-color-tertiary-container)',
    onContainerCssVar: 'var(--sys-color-on-tertiary-container)',
  },
  {
    id: 'secondary',
    label: 'Pizarra Suave',
    cssVar: 'var(--sys-color-secondary)',
    containerCssVar: 'var(--sys-color-secondary-container)',
    onContainerCssVar: 'var(--sys-color-on-secondary-container)',
  },
  {
    id: 'warning',
    label: 'Ámbar Cálido',
    cssVar: 'var(--app-color-warning)',
    containerCssVar: 'var(--app-color-warning-container)',
    onContainerCssVar: 'var(--app-color-on-warning-container)',
  },
  {
    id: 'success',
    label: 'Verde Médico',
    cssVar: 'var(--app-color-success)',
    containerCssVar: 'var(--app-color-success-container)',
    onContainerCssVar: 'var(--app-color-on-success-container)',
  },
];

/** Profesional enriquecido con metadatos de presentación */
export interface IDashboardDoctor extends IActiveProfessional {
  readonly fullName: string;
  readonly initials: string;
  readonly colorTheme: IDoctorColorTheme;
}

/** Geometría de superposición en cascada para cada médico en una fila de 30 min */
export interface IOverlayGeometry {
  readonly layerIndex: number;   // 0 (Principal) | 1 | 2 | 3
  readonly totalLayers: number;  // 1..4
  readonly widthPercent: number; // 100 | 65 | 50 | 35
  readonly leftPercent: number;  // 0 | 35 | 50 | 65
  readonly zIndex: number;       // 10, 20, 30, 40
}

/** Celda proyectada de un médico dentro de una franja de 30 minutos */
export interface IDashboardDoctorCell {
  readonly doctorCedula: string;
  readonly doctorName: string;
  readonly doctorInitials: string;
  readonly specialty: string;
  readonly colorCssVar: string;
  readonly isPrimary: boolean;
  readonly status: DashboardSlotStatus;
  readonly statusLabel: string;
  readonly procedureTitle?: string;
  readonly patientName?: string;
  readonly geometry: IOverlayGeometry;
}

/** Fila horaria canónica de 30 minutos (08:00 a 17:30) */
export interface IDashboardTimeRow {
  readonly timeLabel: string; // '08:00', '08:30', ..., '17:30'
  readonly startMinutes: number;
  readonly endMinutes: number;
  readonly layers: readonly IDashboardDoctorCell[];
}

/** Resumen de KPIs de citas del mes activo con títulos dinámicos */
export interface IDashboardMonthlyKpis {
  readonly confirmedCount: number;
  readonly scheduledCount: number;
  readonly monthName: string;
  readonly monthYearLabel: string;
  readonly confirmedTitle: string;
  readonly scheduledTitle: string;
  readonly weekRangeLabel?: string;
}

/** Alias de retrocompatibilidad */
export type IDashboardWeeklyKpis = IDashboardMonthlyKpis;

