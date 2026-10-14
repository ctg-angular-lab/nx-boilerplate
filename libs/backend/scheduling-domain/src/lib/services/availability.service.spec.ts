import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AvailabilityService } from './availability.service';
import { WorkScheduleService } from './work-schedule.service';
import { MockCalendarAdapter } from '../adapters/mock-calendar.adapter';
import { AppointmentRepository } from '../repositories/appointment.repository';
import { REGEX_TIME_SLOT_DISPLAY } from '@nx-boilerplate/utils';

describe('AvailabilityService', () => {
  let service: AvailabilityService;
  let mockWorkScheduleService: WorkScheduleService;
  let mockCalendarAdapter: MockCalendarAdapter;
  let mockAppointmentRepository: AppointmentRepository;

  beforeEach(() => {
    mockWorkScheduleService = {
      resolveProfessionalSchedule: vi.fn().mockResolvedValue({
        diasLaborales: ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'],
        horaInicio: '07:00',
        horaFin: '19:00',
        recesoAlmuerzo: { inicio: '12:00', fin: '13:00' },
      }),
    } as unknown as WorkScheduleService;

    mockCalendarAdapter = new MockCalendarAdapter();
    mockAppointmentRepository = {
      findByDoctorAndDateRange: vi.fn().mockResolvedValue([]),
    } as unknown as AppointmentRepository;

    service = new AvailabilityService(
      mockWorkScheduleService,
      mockCalendarAdapter,
      mockAppointmentRepository
    );
  });

  it('debe calcular los slots disponibles excluyendo el almuerzo', async () => {
    const testDate = new Date('2026-09-25T12:00:00.000Z');
    const slots = await service.getAvailableSlots(
      'dr@example.com',
      '12345',
      testDate,
      60
    );

    expect(slots.length).toBeGreaterThan(0);
    for (const slot of slots) {
      const cotHour = new Date(slot.start.getTime() - 5 * 3600 * 1000).getUTCHours();
      expect(cotHour).not.toBe(12);
    }
  });

  it('debe retornar lista vacía de slots si el día no es laborable', async () => {
    // 2026-09-27 es Domingo
    const sunday = new Date('2026-09-27T12:00:00.000Z');
    const slots = await service.getAvailableSlots(
      'dr@example.com',
      '12345',
      sunday,
      60
    );
    expect(slots).toEqual([]);
  });

  it('debe retornar disponibilidad para un rango semanal marcando isWorkingDay', async () => {
    const startDate = new Date('2026-09-21T12:00:00.000Z');
    const endDate = new Date('2026-09-27T12:00:00.000Z');

    const result = await service.getAvailableSlotsForRange(
      'dr@example.com',
      startDate,
      endDate,
      45
    );

    expect(result.length).toBeGreaterThanOrEqual(6);
    expect(result[0]).toHaveProperty('isWorkingDay');
    if (result[0].slots.length > 0) {
      expect(result[0].slots[0].display).toMatch(REGEX_TIME_SLOT_DISPLAY);
    }
  });
});
