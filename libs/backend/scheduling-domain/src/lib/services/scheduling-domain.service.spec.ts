import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SchedulingDomainService } from './scheduling-domain.service';
import { MockCalendarAdapter } from '../adapters/mock-calendar.adapter';
import { AppointmentRepository } from '../repositories/appointment.repository';
import { AppointmentStatus } from '../schemas/appointment.schema';

describe('SchedulingDomainService', () => {
  let service: SchedulingDomainService;
  let mockCalendarAdapter: MockCalendarAdapter;
  let mockAppointmentRepository: AppointmentRepository;

  beforeEach(() => {
    mockCalendarAdapter = new MockCalendarAdapter();
    mockAppointmentRepository = {
      findByDoctorAndDateRange: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockImplementation((data) => Promise.resolve({ ...data, _id: 'mongo-id-123' })),
      findById: vi.fn(),
      findByPatientNationalId: vi.fn(),
    } as unknown as AppointmentRepository;

    service = new SchedulingDomainService(mockCalendarAdapter, mockAppointmentRepository);
  });

  it('debe calcular los slots disponibles excluyendo el almuerzo y colisiones', async () => {
    const testDate = new Date('2026-09-25T00:00:00.000Z');
    const doctorEmail = 'camilotabares.portafolio@gmail.com';
    const doctorCedula = '1020304050';
    const durationMinutes = 60;

    const slots = await service.getAvailableSlots(
      doctorEmail,
      doctorCedula,
      testDate,
      durationMinutes
    );

    expect(slots.length).toBeGreaterThan(0);

    // Ningún slot disponible debe solaparse con el almuerzo (12:00 a 13:00)
    for (const slot of slots) {
      const startHour = slot.start.getHours();
      expect(startHour).not.toBe(12);
    }
  });

  it('debe reservar una cita exitosamente con MockCalendarAdapter y MongoDB', async () => {
    const start = new Date('2026-09-25T09:00:00.000Z');
    const end = new Date('2026-09-25T10:00:00.000Z');

    const appointment = await service.bookAppointment({
      doctorEmail: 'camilotabares.portafolio@gmail.com',
      doctorCedula: '1020304050',
      patientNationalId: '12345678',
      patientFullName: 'Juan Pérez',
      patientEmail: 'juan.perez@example.com',
      procedureId: 'proc-101',
      procedureName: 'Valoración Estética Facial',
      startTime: start,
      endTime: end,
      notes: 'Primera consulta estética',
    });

    expect(appointment).toBeDefined();
    expect(appointment.appointmentId).toContain('APT-');
    expect(appointment.status).toBe(AppointmentStatus.CONFIRMED);
    expect(appointment.googleCalendarEventId).toContain('mock-google-id-');
  });
});
