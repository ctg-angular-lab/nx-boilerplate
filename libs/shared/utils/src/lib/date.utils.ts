import { CalendarDay, TimeSlot, IWeekWindow } from '@nx-boilerplate/api-interfaces';

/**
 * Formatea una fecha local a YYYY-MM-DD
 */
export function formatDateYMD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Convierte minutos desde medianoche a formato 12 horas (ej. 08:45 AM)
 */
export function formatTime12h(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  const formattedHours = displayHours < 10 ? `0${displayHours}` : `${displayHours}`;
  const formattedMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
  return `${formattedHours}:${formattedMinutes} ${period}`;
}

/**
 * Obtiene la fecha actual en la zona horaria de Colombia (America/Bogota, UTC-5)
 * a las 00:00:00 horas locales.
 */
export function getColombiaToday(): Date {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const [year, month, day] = formatter.format(new Date()).split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

/**
 * Normaliza cualquier fecha a medianoche (00:00:00) para comparaciones de día
 */
export function normalizeDate(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

/**
 * Calcula la ventana laboral (lunes a sábado, sin domingos) según el offset semanal.
 * Para la semana actual (offset 0), inicia desde hoy y va hasta el sábado.
 */
export function getWeekWindow(offsetWeeks = 0, referenceDate?: Date): IWeekWindow {
  const today = referenceDate ? normalizeDate(referenceDate) : getColombiaToday();
  const dayOfWeek = today.getDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado

  const mondayOffset = dayOfWeek === 0 ? 1 : 1 - dayOfWeek;
  const baseMonday = new Date(today);
  baseMonday.setDate(today.getDate() + mondayOffset);

  const targetMonday = new Date(baseMonday);
  targetMonday.setDate(baseMonday.getDate() + offsetWeeks * 7);

  const targetSaturday = new Date(targetMonday);
  targetSaturday.setDate(targetMonday.getDate() + 5);

  if (offsetWeeks === 0) {
    if (dayOfWeek === 0) {
      return {
        startDate: formatDateYMD(targetMonday),
        endDate: formatDateYMD(targetSaturday),
        totalDays: 6,
        offsetWeeks: 0,
      };
    } else {
      const diffToSaturday = 6 - dayOfWeek;
      const thisSaturday = new Date(today);
      thisSaturday.setDate(today.getDate() + diffToSaturday);
      const totalDays = 6 - dayOfWeek + 1;

      return {
        startDate: formatDateYMD(today),
        endDate: formatDateYMD(thisSaturday),
        totalDays,
        offsetWeeks: 0,
      };
    }
  }

  return {
    startDate: formatDateYMD(targetMonday),
    endDate: formatDateYMD(targetSaturday),
    totalDays: 6,
    offsetWeeks,
  };
}

/**
 * Retorna el array de 7 días (Lunes a Domingo) y la ventana calculada para iterar en la vista de calendario
 */
export function getWeekSchedule(offsetWeeks = 0, referenceDate?: Date): { days: Date[]; window: IWeekWindow } {
  const window = getWeekWindow(offsetWeeks, referenceDate);
  const weekRange = getColombiaWeekRange(offsetWeeks);

  return { days: weekRange.days, window };
}

/**
 * Calcula el lunes y domingo de la semana correspondiente a partir de un offset
 * (0 = semana actual, 1 = próxima semana, etc.)
 */
export function getColombiaWeekRange(offsetWeeks = 0): { start: Date; end: Date; days: Date[] } {
  const today = getColombiaToday();
  const dayOfWeek = today.getDay(); // 0 = Domingo, 1 = Lunes, ...
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const monday = new Date(today);
  monday.setDate(today.getDate() + diffToMonday + offsetWeeks * 7);

  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    days.push(day);
  }

  return {
    start: monday,
    end: days[6],
    days,
  };
}

/**
 * Nombres y formatos en español para las etiquetas del calendario
 */
const DAY_LABELS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const DAY_PREFIXES = ['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom'];
const MONTH_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/**
 * Genera la estructura completa de 7 días (CalendarDay[]) para una semana dada
 */
export function buildCalendarWeek(
  days: Date[],
  reservedSchedule: Record<number, number[]> = {
    0: [1, 3, 7],
    1: [2, 5, 8],
    2: [0, 4, 9, 12],
    3: [3, 6, 11],
    4: [1, 4, 7, 10],
    5: [2, 5],
  }
): CalendarDay[] {
  const today = getColombiaToday();
  const todayTime = today.getTime();

  return days.map((dayDate, index) => {
    const normalized = normalizeDate(dayDate);
    const dayTime = normalized.getTime();
    const isToday = dayTime === todayTime;
    const isPast = dayTime < todayTime;
    const isSunday = index === 6;
    const isAvailable = !isSunday && !isPast;

    const label = DAY_LABELS[index];
    const subLabel = `${dayDate.getDate()} ${MONTH_SHORT[dayDate.getMonth()]}`;
    const slots = isAvailable
      ? generateDaySlots(DAY_PREFIXES[index], reservedSchedule[index] ?? [])
      : [];

    return {
      date: dayDate,
      label,
      subLabel,
      isToday,
      isPast,
      isAvailable,
      slots,
    };
  });
}

/**
 * Generador declarativo de slots de tiempo de 45 minutos (08:00 AM - 07:00 PM)
 */
export function generateDaySlots(
  dayPrefix: string,
  reservedIndices: number[] = [],
  reservedByDoctors: string[] = ['Dra. Botero', 'Dr. Mendoza', 'Dr. Restrepo']
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const startMinutes = 8 * 60; // 08:00 AM
  const endMinutes = 19 * 60;  // 07:00 PM
  const intervalMinutes = 45;
  let slotIndex = 0;

  for (let current = startMinutes; current + intervalMinutes <= endMinutes; current += intervalMinutes) {
    const isReserved = reservedIndices.includes(slotIndex);
    const doctor = isReserved ? reservedByDoctors[slotIndex % reservedByDoctors.length] : undefined;
    slots.push({
      id: `${dayPrefix}-slot-${slotIndex + 1}`,
      time: formatTime12h(current),
      status: isReserved ? 'reservado' : 'disponible',
      ...(doctor && { reservedBy: doctor }),
    });
    slotIndex++;
  }

  return slots;
}
