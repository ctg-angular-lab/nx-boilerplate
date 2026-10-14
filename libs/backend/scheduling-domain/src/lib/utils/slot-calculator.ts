import { IWorkSchedule } from '@nx-boilerplate/api-interfaces';
import { ITimeSlot } from '../ports/calendar-provider.port';
import { removeDiacritics } from '@nx-boilerplate/utils';

export const DIAS_SEMANA_MAP: Record<number, string> = {
  0: 'DOMINGO',
  1: 'LUNES',
  2: 'MARTES',
  3: 'MIERCOLES',
  4: 'JUEVES',
  5: 'VIERNES',
  6: 'SABADO',
};

export const DAY_NAMES_ES = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
];

export const DEFAULT_SCHEDULE: IWorkSchedule = {
  diasLaborales: ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'],
  horaInicio: '07:00',
  horaFin: '19:00',
  recesoAlmuerzo: {
    inicio: '12:00',
    fin: '13:00',
  },
};

/**
 * Convierte un Date a fecha 'YYYY-MM-DD' en zona horaria Colombia (UTC-5).
 */
export function getCotDateString(date: Date): string {
  const cotMs = date.getTime() - 5 * 60 * 60 * 1000;
  return new Date(cotMs).toISOString().substring(0, 10);
}

/**
 * Retorna el día de la semana (0=Domingo..6=Sábado) en hora Colombia (UTC-5).
 */
export function getCotDayOfWeek(date: Date): number {
  const cotMs = date.getTime() - 5 * 60 * 60 * 1000;
  return new Date(cotMs).getUTCDay();
}

/**
 * Retorna 'HH:mm' en hora Colombia (UTC-5).
 */
export function getCotTimeString(date: Date): string {
  const cotMs = date.getTime() - 5 * 60 * 60 * 1000;
  return new Date(cotMs).toISOString().substring(11, 16);
}

/**
 * Construye un Date UTC a partir de fecha 'YYYY-MM-DD' y hora 'HH:mm' en horario Colombia (-05:00).
 */
export function createCotDate(dateStr: string, timeStr: string): Date {
  return new Date(`${dateStr}T${timeStr}:00-05:00`);
}

/**
 * Evalúa si un día específico es laborable para el especialista según su lista configurada.
 */
export function isWorkingDay(targetDate: Date, diasLaborales?: string[]): boolean {
  if (!diasLaborales || diasLaborales.length === 0) {
    return false;
  }
  const dayOfWeek = getCotDayOfWeek(targetDate);
  const dayEnumName = DIAS_SEMANA_MAP[dayOfWeek];
  const normalizedDias = diasLaborales.map((d) => removeDiacritics(d).toUpperCase().trim());
  return normalizedDias.includes(dayEnumName);
}

/**
 * Delimita los instantes de inicio y fin de la jornada laboral en horario Colombia.
 */
export function buildWorkWindow(
  dateStr: string,
  schedule: IWorkSchedule
): { workStart: Date; workEnd: Date } {
  const [startH, startM] = (schedule.horaInicio || '07:00').split(':');
  const [endH, endM] = (schedule.horaFin || '19:00').split(':');
  return {
    workStart: createCotDate(dateStr, `${startH}:${startM}`),
    workEnd: createCotDate(dateStr, `${endH}:${endM}`),
  };
}

/**
 * Delimita la ventana de receso de almuerzo en horario Colombia si está configurada.
 */
export function buildLunchWindow(
  dateStr: string,
  schedule: IWorkSchedule
): { lunchStart: Date; lunchEnd: Date } | null {
  if (schedule.recesoAlmuerzo?.inicio && schedule.recesoAlmuerzo?.fin) {
    return {
      lunchStart: createCotDate(dateStr, schedule.recesoAlmuerzo.inicio),
      lunchEnd: createCotDate(dateStr, schedule.recesoAlmuerzo.fin),
    };
  }
  return null;
}

/**
 * Determina si dos intervalos de tiempo colisionan.
 */
export function isOverlapping(
  slotStart: Date,
  slotEnd: Date,
  busyIntervals: ITimeSlot[]
): boolean {
  return busyIntervals.some(
    (busy) => slotStart.getTime() < busy.end.getTime() && slotEnd.getTime() > busy.start.getTime()
  );
}

/**
 * Genera slots continuos de duración procedureDurationMinutes restando intervalos ocupados.
 */
export function generateAvailableSlots(options: {
  workStart: Date;
  workEnd: Date;
  procedureDurationMinutes: number;
  busyIntervals: ITimeSlot[];
}): ITimeSlot[] {
  const { workStart, workEnd, procedureDurationMinutes, busyIntervals } = options;
  const slotDurationMs = procedureDurationMinutes * 60 * 1000;
  const availableSlots: ITimeSlot[] = [];
  let currentStart = new Date(workStart);

  while (currentStart.getTime() + slotDurationMs <= workEnd.getTime()) {
    const currentEnd = new Date(currentStart.getTime() + slotDurationMs);
    if (!isOverlapping(currentStart, currentEnd, busyIntervals)) {
      availableSlots.push({
        start: new Date(currentStart),
        end: new Date(currentEnd),
      });
    }
    currentStart = new Date(currentStart.getTime() + slotDurationMs);
  }

  return availableSlots;
}
