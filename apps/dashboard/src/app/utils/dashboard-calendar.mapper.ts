import { IDayAvailability, ISlotDisplay } from '@nx-boilerplate/api-interfaces';
import { formatDateYMD, getColombiaToday, removeDiacritics } from '@nx-boilerplate/utils';
import {
  DashboardSlotStatus,
  DOCTOR_COLOR_THEMES,
  IDashboardDoctor,
  IDashboardDoctorCell,
  IDashboardMonthlyKpis,
  IDashboardTimeRow,
  IDashboardWeeklyKpis,
  IOverlayGeometry,
} from '../models/dashboard.models';

export const CASCADE_WIDTHS: readonly number[] = [100, 65, 50, 35];

const DIAS_SEMANA_MAP: Record<number, string> = {
  0: 'DOMINGO',
  1: 'LUNES',
  2: 'MARTES',
  3: 'MIERCOLES',
  4: 'JUEVES',
  5: 'VIERNES',
  6: 'SABADO',
};

const SLOT_STATUS_PRIORITY: Record<string, number> = {
  CONFIRMED: 4,
  TENTATIVE: 3,
  BLOCKED_PERSONAL: 2,
  AVAILABLE: 1,
};

/**
 * Calcula la geometría de cascada (anchos, left y z-index) para hasta 4 capas
 */
export function calculateOverlayGeometry(
  layerIndex: number,
  totalLayers: number
): IOverlayGeometry {
  const safeIndex = Math.max(0, Math.min(layerIndex, CASCADE_WIDTHS.length - 1));
  const widthPercent = CASCADE_WIDTHS[safeIndex];
  const leftPercent = 100 - widthPercent;

  return {
    layerIndex: safeIndex,
    totalLayers: Math.min(totalLayers, CASCADE_WIDTHS.length),
    widthPercent,
    leftPercent,
    zIndex: (safeIndex + 1) * 10,
  };
}

/**
 * Extrae minutos desde las 00:00 a partir de una hora en formato 'HH:mm'
 */
export function timeStringToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.trim().split(':');
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  return hours * 60 + minutes;
}

/**
 * Extrae minutos desde las 00:00 (en hora local de Colombia UTC-5) a partir de una fecha ISO UTC, ISO local o string 'HH:mm'
 */
export function isoOrTimeToMinutes(value: string): number {
  if (!value) return 0;
  if (value.includes('T')) {
    const timePart = value.split('T')[1] || '';
    const hasExplicitTz =
      timePart.endsWith('Z') ||
      timePart.endsWith('z') ||
      /[+-]\d{2}:?\d{2}$/.test(timePart);

    if (hasExplicitTz) {
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) {
        // Convertir instante UTC a hora oficial de Colombia (UTC-5)
        const cotMs = parsed.getTime() - 5 * 60 * 60 * 1000;
        const cotTimeStr = new Date(cotMs).toISOString().substring(11, 16);
        return timeStringToMinutes(cotTimeStr);
      }
    }
    return timeStringToMinutes(timePart);
  }
  return timeStringToMinutes(value);
}

/**
 * Convierte una hora (string 'HH:mm' o ISO) a formato 12 horas con sufijo am/pm (ej: '9:00 am', '2:30 pm')
 */
export function formatTime12h(timeStr: string): string {
  if (!timeStr) return '';
  const totalMinutes = isoOrTimeToMinutes(timeStr);
  const hours24 = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  const period = hours24 >= 12 ? 'pm' : 'am';
  const hours12 = hours24 % 12 || 12;
  const minutesPadded = minutes.toString().padStart(2, '0');
  return `${hours12}:${minutesPadded} ${period}`;
}

/**
 * Determina si una fecha corresponde a un día laborable del profesional
 */
export function isDoctorWorkingOnDate(
  targetDate: Date,
  diasLaborales?: readonly string[],
  dayAvailability?: IDayAvailability
): boolean {
  if (dayAvailability && typeof dayAvailability.isWorkingDay === 'boolean') {
    return dayAvailability.isWorkingDay;
  }
  if (!diasLaborales || diasLaborales.length === 0) {
    return true;
  }
  const dayEnumName = DIAS_SEMANA_MAP[targetDate.getDay()];
  const normalized = diasLaborales.map((d) => removeDiacritics(d).toUpperCase().trim());
  return normalized.includes(dayEnumName);
}

/**
 * Resuelve la etiqueta legible de un estado de bloque
 */
export function getStatusLabel(status: DashboardSlotStatus): string {
  switch (status) {
    case 'CONFIRMED':
      return 'Confirmada';
    case 'SCHEDULED':
      return 'Agendada';
    case 'BLOCKED':
      return 'Bloqueado';
    case 'LUNCH':
      return 'Almuerzo';
    case 'AVAILABLE':
      return 'Disponible';
    case 'OUT_OF_HOURS':
    default:
      return 'Fuera de horario';
  }
}

/**
 * Proyecta los horarios e intervalos de los médicos activos sobre los 20 bloques canónicos de 30 minutos (08:00 a 17:30)
 */
export function buildTimeGridRows(
  selectedDate: Date,
  activeDoctors: readonly IDashboardDoctor[],
  availabilityByCedula: Record<string, IDayAvailability[]>
): readonly IDashboardTimeRow[] {
  const selectedDateStr = formatDateYMD(selectedDate);
  const totalLayers = Math.min(activeDoctors.length, 4);

  // Generamos los 20 intervalos de 30 min (08:00 = 480 min hasta 17:30 = 1050 min)
  const rows: IDashboardTimeRow[] = [];
  for (let minute = 8 * 60; minute <= 17 * 60 + 30; minute += 30) {
    const hours = Math.floor(minute / 60);
    const mins = minute % 60;
    const timeLabel = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    const rowStart = minute;
    const rowEnd = minute + 30;

    const layers: IDashboardDoctorCell[] = [];

    activeDoctors.slice(0, 4).forEach((doctor, layerIndex) => {
      const geometry = calculateOverlayGeometry(layerIndex, totalLayers);
      const days = availabilityByCedula[doctor.cedula] || [];
      const currentDayAvailability = days.find((d) => d.date === selectedDateStr);

      const horario = doctor.horarioTrabajo;
      const docWorkStart = horario?.horaInicio ? timeStringToMinutes(horario.horaInicio) : 8 * 60;
      const docWorkEnd = horario?.horaFin ? timeStringToMinutes(horario.horaFin) : 18 * 60;

      const lunchStart = horario?.recesoAlmuerzo?.inicio
        ? timeStringToMinutes(horario.recesoAlmuerzo.inicio)
        : null;
      const lunchEnd = horario?.recesoAlmuerzo?.fin
        ? timeStringToMinutes(horario.recesoAlmuerzo.fin)
        : null;

      // Evaluar si el día y la hora están dentro de la jornada laboral del profesional
      const isWorkingDay = isDoctorWorkingOnDate(
        selectedDate,
        horario?.diasLaborales,
        currentDayAvailability
      );
      const isWorkingHour = isWorkingDay && rowStart >= docWorkStart && rowEnd <= docWorkEnd;

      // Evaluar si cae en receso de almuerzo
      const isLunch =
        lunchStart !== null &&
        lunchEnd !== null &&
        Math.max(rowStart, lunchStart) < Math.min(rowEnd, lunchEnd);

      let status: DashboardSlotStatus = 'AVAILABLE';
      let procedureTitle: string | undefined = undefined;
      let patientName: string | undefined = undefined;
      let durationMinutes: number | undefined = undefined;
      let timeRangeLabel: string | undefined = undefined;
      let spanRatio = 1;
      let isContinuation = false;

      if (!isWorkingHour) {
        status = 'OUT_OF_HOURS';
      } else if (isLunch) {
        status = 'LUNCH';
      } else if (currentDayAvailability?.slots && currentDayAvailability.slots.length > 0) {
        // Filtrar todos los slots que se intersectan con [rowStart, rowEnd] y priorizar citas ocupadas sobre disponibles
        const overlappingSlots = currentDayAvailability.slots.filter((slot: ISlotDisplay) => {
          const slotStart = isoOrTimeToMinutes(slot.startTime);
          const slotEnd = isoOrTimeToMinutes(slot.endTime);
          return Math.max(rowStart, slotStart) < Math.min(rowEnd, slotEnd);
        });

        const matchedSlot = overlappingSlots.sort(
          (a, b) => (SLOT_STATUS_PRIORITY[b.status] || 0) - (SLOT_STATUS_PRIORITY[a.status] || 0)
        )[0];

        if (matchedSlot) {
          const slotStart = isoOrTimeToMinutes(matchedSlot.startTime);
          const slotEnd = isoOrTimeToMinutes(matchedSlot.endTime);
          const computedDuration =
            typeof matchedSlot.durationMinutes === 'number' && matchedSlot.durationMinutes > 0
              ? matchedSlot.durationMinutes
              : Math.max(5, slotEnd - slotStart);

          if (matchedSlot.patient) {
            patientName = `${matchedSlot.patient.nombre} ${matchedSlot.patient.apellidos}`.trim();
          }

          if (matchedSlot.status === 'CONFIRMED') {
            status = 'CONFIRMED';
            procedureTitle = matchedSlot.title;
            durationMinutes = computedDuration;
            timeRangeLabel = matchedSlot.display;
            isContinuation = slotStart < rowStart && rowStart > 8 * 60;
            spanRatio = isContinuation ? 1 : Math.max(0.5, computedDuration / 30);
          } else if (matchedSlot.status === 'TENTATIVE') {
            status = 'SCHEDULED';
            procedureTitle = matchedSlot.title;
            durationMinutes = computedDuration;
            timeRangeLabel = matchedSlot.display;
            isContinuation = slotStart < rowStart && rowStart > 8 * 60;
            spanRatio = isContinuation ? 1 : Math.max(0.5, computedDuration / 30);
          } else if (matchedSlot.status === 'BLOCKED_PERSONAL') {
            if (matchedSlot.title?.toLowerCase() === 'almuerzo') {
              status = 'LUNCH';
            } else {
              status = 'BLOCKED';
              procedureTitle = matchedSlot.title;
              durationMinutes = computedDuration;
              timeRangeLabel = matchedSlot.display;
            }
          } else {
            status = 'AVAILABLE';
            durationMinutes = computedDuration;
            timeRangeLabel = matchedSlot.display;
          }
        }
      }

      layers.push({
        doctorCedula: doctor.cedula,
        doctorName: doctor.fullName,
        doctorInitials: doctor.initials,
        specialty: doctor.profesion || 'General',
        colorCssVar: doctor.colorTheme.cssVar,
        isPrimary: layerIndex === 0,
        status,
        statusLabel: getStatusLabel(status),
        procedureTitle,
        patientName,
        durationMinutes,
        timeRangeLabel,
        spanRatio,
        isContinuation,
        geometry,
      });
    });

    rows.push({
      timeLabel,
      startMinutes: rowStart,
      endMinutes: rowEnd,
      layers,
    });
  }

  return rows;
}

/**
 * Busca la fecha del próximo turno disponible en el mes y la formatea en DD/MM/YYYY
 */
export function findNextAvailableDate(
  monthlyAvailability: readonly IDayAvailability[] | undefined,
  referenceDate: Date = getColombiaToday()
): string {
  if (!monthlyAvailability || monthlyAvailability.length === 0) {
    return 'Sin Cupos este mes';
  }

  const todayStr = formatDateYMD(referenceDate);
  const currentMinutes = referenceDate.getHours() * 60 + referenceDate.getMinutes();

  // Ordenar días cronológicamente
  const sortedDays = [...monthlyAvailability].sort((a, b) => a.date.localeCompare(b.date));

  for (const day of sortedDays) {
    if (day.date < todayStr || !day.slots || day.slots.length === 0) continue;

    const isToday = day.date === todayStr;
    const availableSlot = day.slots.find((slot) => {
      if (slot.status !== 'AVAILABLE' || slot.isBookable !== true) return false;
      if (isToday) {
        const slotMinutes = isoOrTimeToMinutes(slot.startTime);
        return slotMinutes >= currentMinutes;
      }
      return true;
    });

    if (availableSlot) {
      const [year, month, d] = day.date.split('-');
      const timeStr = formatTime12h(availableSlot.startTime);
      return timeStr ? `${d}/${month}/${year} - ${timeStr}` : `${d}/${month}/${year}`;
    }
  }

  return 'Sin Cupos este mes';
}

/**
 * Computa la sumatoria de citas confirmadas y agendadas para el mes completo de la fecha activa
 * con títulos contextuales adaptados al mes.
 */
export function computeMonthlyKpis(
  monthlyAvailability: readonly IDayAvailability[] | undefined,
  activeDate: Date
): IDashboardMonthlyKpis {
  const d = activeDate || new Date();
  const rawMonthName = new Intl.DateTimeFormat('es-CO', { month: 'long' }).format(d);
  const monthName = rawMonthName.charAt(0).toUpperCase() + rawMonthName.slice(1);
  const monthYearLabel = `${monthName} ${d.getFullYear()}`;

  let confirmedCount = 0;
  let scheduledCount = 0;

  if (monthlyAvailability && monthlyAvailability.length > 0) {
    for (const day of monthlyAvailability) {
      if (!day.slots) continue;
      for (const slot of day.slots) {
        if (slot.status === 'CONFIRMED') {
          confirmedCount++;
        } else if (slot.status === 'TENTATIVE') {
          scheduledCount++;
        }
      }
    }
  }

  const nextAvailableDate = findNextAvailableDate(monthlyAvailability, d);

  return {
    confirmedCount,
    scheduledCount,
    monthName,
    monthYearLabel,
    confirmedTitle: `Citas de ${monthName} Confirmadas`,
    scheduledTitle: `Citas de ${monthName} Agendadas`,
    nextAvailableDate,
    weekRangeLabel: monthYearLabel,
  };
}

/**
 * Computa la sumatoria de citas confirmadas y agendadas para la semana del médico activo (retrocompatibilidad)
 */
export function computeWeeklyKpis(
  weeklyAvailability: readonly IDayAvailability[] | undefined,
  weekRangeLabel = 'Esta semana'
): IDashboardWeeklyKpis {
  let confirmedCount = 0;
  let scheduledCount = 0;

  if (weeklyAvailability && weeklyAvailability.length > 0) {
    for (const day of weeklyAvailability) {
      if (!day.slots) continue;
      for (const slot of day.slots) {
        if (slot.status === 'CONFIRMED') {
          confirmedCount++;
        } else if (slot.status === 'TENTATIVE') {
          scheduledCount++;
        }
      }
    }
  }

  return {
    confirmedCount,
    scheduledCount,
    monthName: 'Mes',
    monthYearLabel: weekRangeLabel,
    confirmedTitle: 'Citas Confirmadas',
    scheduledTitle: 'Citas Agendadas',
    nextAvailableDate: 'Sin Cupos este mes',
    weekRangeLabel,
  };
}

/**
 * Genera iniciales a partir de nombres y apellidos
 */
export function extractInitials(nombres: string, apellidos: string): string {
  const n = (nombres || '').trim().charAt(0).toUpperCase();
  const a = (apellidos || '').trim().charAt(0).toUpperCase();
  return `${n}${a}` || 'MD';
}

/**
 * Asigna un tema de color determinista a partir del índice o cédula
 */
export function assignDoctorColorTheme(index: number): typeof DOCTOR_COLOR_THEMES[number] {
  const safeIdx = Math.abs(index) % DOCTOR_COLOR_THEMES.length;
  return DOCTOR_COLOR_THEMES[safeIdx];
}
