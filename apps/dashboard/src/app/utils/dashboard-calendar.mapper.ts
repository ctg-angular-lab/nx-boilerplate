import { IDayAvailability, ISlotDisplay } from '@nx-boilerplate/api-interfaces';
import { formatDateYMD } from '@nx-boilerplate/utils';
import {
  DashboardSlotStatus,
  DOCTOR_COLOR_THEMES,
  IDashboardDoctor,
  IDashboardDoctorCell,
  IDashboardTimeRow,
  IDashboardWeeklyKpis,
  IOverlayGeometry,
} from '../models/dashboard.models';

export const CASCADE_WIDTHS: readonly number[] = [100, 65, 50, 35];

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
 * Extrae minutos desde las 00:00 a partir de una fecha ISO o string 'HH:mm'
 */
export function isoOrTimeToMinutes(value: string): number {
  if (!value) return 0;
  if (value.includes('T')) {
    const timePart = value.split('T')[1];
    return timeStringToMinutes(timePart);
  }
  return timeStringToMinutes(value);
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

      // Evaluar horario laboral general
      const isWorkingHour = rowStart >= docWorkStart && rowEnd <= docWorkEnd;

      // Evaluar si cae en receso de almuerzo
      const isLunch =
        lunchStart !== null &&
        lunchEnd !== null &&
        Math.max(rowStart, lunchStart) < Math.min(rowEnd, lunchEnd);

      let status: DashboardSlotStatus = 'AVAILABLE';
      let procedureTitle: string | undefined = undefined;
      let patientName: string | undefined = undefined;

      if (!isWorkingHour) {
        status = 'OUT_OF_HOURS';
      } else if (isLunch) {
        status = 'LUNCH';
      } else if (currentDayAvailability?.slots && currentDayAvailability.slots.length > 0) {
        // Buscar si algún slot se intersecta con la franja [rowStart, rowEnd]
        const matchedSlot = currentDayAvailability.slots.find((slot: ISlotDisplay) => {
          const slotStart = isoOrTimeToMinutes(slot.startTime);
          const slotEnd = isoOrTimeToMinutes(slot.endTime);
          return Math.max(rowStart, slotStart) < Math.min(rowEnd, slotEnd);
        });

        if (matchedSlot) {
          procedureTitle = matchedSlot.title;
          if (matchedSlot.patient) {
            patientName = `${matchedSlot.patient.nombre} ${matchedSlot.patient.apellidos}`.trim();
          }

          if (matchedSlot.status === 'CONFIRMED') {
            status = 'CONFIRMED';
          } else if (matchedSlot.status === 'TENTATIVE') {
            status = 'SCHEDULED';
          } else if (matchedSlot.status === 'BLOCKED_PERSONAL') {
            status = 'BLOCKED';
          } else {
            status = 'AVAILABLE';
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
 * Computa la sumatoria de citas confirmadas y agendadas para la semana del médico activo
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
