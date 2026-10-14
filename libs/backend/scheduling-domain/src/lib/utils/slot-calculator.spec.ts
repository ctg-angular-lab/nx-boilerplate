import { describe, it, expect } from 'vitest';
import {
  isWorkingDay,
  buildWorkWindow,
  buildLunchWindow,
  isOverlapping,
  generateAvailableSlots,
  getCotDateString,
  getCotTimeString,
  DEFAULT_SCHEDULE,
} from './slot-calculator';

describe('SlotCalculator (Pure Utils)', () => {
  it('debe convertir fechas UTC a formato Colombia YYYY-MM-DD y HH:mm', () => {
    // 2026-09-25 14:00:00 UTC -> 2026-09-25 09:00:00 COT
    const date = new Date('2026-09-25T14:00:00.000Z');
    expect(getCotDateString(date)).toBe('2026-09-25');
    expect(getCotTimeString(date)).toBe('09:00');
  });

  it('debe validar días laborales ignorando tildes y mayúsculas', () => {
    // 2026-09-25 es Viernes
    const friday = new Date('2026-09-25T14:00:00.000Z');
    // 2026-09-27 es Domingo
    const sunday = new Date('2026-09-27T14:00:00.000Z');

    expect(isWorkingDay(friday, ['VIERNES', 'SÁBADO'])).toBe(true);
    expect(isWorkingDay(sunday, ['VIERNES', 'SÁBADO'])).toBe(false);
  });

  it('debe construir la ventana de trabajo y almuerzo en horario Colombia', () => {
    const work = buildWorkWindow('2026-09-25', DEFAULT_SCHEDULE);
    expect(work.workStart.toISOString()).toBe('2026-09-25T12:00:00.000Z'); // 07:00 COT
    expect(work.workEnd.toISOString()).toBe('2026-09-26T00:00:00.000Z');   // 19:00 COT

    const lunch = buildLunchWindow('2026-09-25', DEFAULT_SCHEDULE);
    expect(lunch).not.toBeNull();
    expect(lunch?.lunchStart.toISOString()).toBe('2026-09-25T17:00:00.000Z'); // 12:00 COT
    expect(lunch?.lunchEnd.toISOString()).toBe('2026-09-25T18:00:00.000Z');   // 13:00 COT
  });

  it('debe generar slots excluyendo colisiones y recesos de almuerzo', () => {
    const work = buildWorkWindow('2026-09-25', {
      diasLaborales: ['VIERNES'],
      horaInicio: '08:00',
      horaFin: '11:00',
    });

    const busy = [
      {
        start: new Date('2026-09-25T14:00:00.000Z'), // 09:00 COT
        end: new Date('2026-09-25T15:00:00.000Z'),   // 10:00 COT
      },
    ];

    const slots = generateAvailableSlots({
      workStart: work.workStart,
      workEnd: work.workEnd,
      procedureDurationMinutes: 60,
      busyIntervals: busy,
    });

    // 08:00 a 09:00 (disponible), 09:00 a 10:00 (ocupado), 10:00 a 11:00 (disponible)
    expect(slots.length).toBe(2);
    expect(getCotTimeString(slots[0].start)).toBe('08:00');
    expect(getCotTimeString(slots[1].start)).toBe('10:00');
  });

  it('debe detectar correctamente colisiones parciales y completas', () => {
    const slotStart = new Date('2026-09-25T14:00:00.000Z');
    const slotEnd = new Date('2026-09-25T15:00:00.000Z');

    const overlapping = [
      {
        start: new Date('2026-09-25T14:30:00.000Z'),
        end: new Date('2026-09-25T15:30:00.000Z'),
      },
    ];

    const notOverlapping = [
      {
        start: new Date('2026-09-25T15:00:00.000Z'),
        end: new Date('2026-09-25T16:00:00.000Z'),
      },
    ];

    expect(isOverlapping(slotStart, slotEnd, overlapping)).toBe(true);
    expect(isOverlapping(slotStart, slotEnd, notOverlapping)).toBe(false);
  });
});
