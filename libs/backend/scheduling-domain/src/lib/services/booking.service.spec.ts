import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BookingService } from './booking.service';
import { WorkScheduleService } from './work-schedule.service';
import { MockCalendarAdapter } from '../adapters/mock-calendar.adapter';
import { AppointmentRepository } from '../repositories/appointment.repository';
import { AppointmentStatus } from '../schemas/appointment.schema';
import { RpcException } from '@nestjs/microservices';

describe('BookingService', () => {
  let service: BookingService;
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
      create: vi.fn().mockImplementation((data) => Promise.resolve({ ...data, _id: 'mongo-id-123' })),
    } as unknown as AppointmentRepository;

    service = new BookingService(
      mockWorkScheduleService,
      mockCalendarAdapter,
      mockAppointmentRepository
    );
  });

  it('debe reservar una cita exitosamente dentro de jornada', async () => {
    const start = new Date('2026-09-25T14:00:00.000Z'); // 09:00 COT
    const end = new Date('2026-09-25T15:00:00.000Z');

    const appointment = await service.bookAppointment({
      doctorEmail: 'dr@example.com',
      doctorCedula: '12345',
      patientNationalId: '987654',
      patientFullName: 'Paciente Prueba',
      patientEmail: 'paciente@example.com',
      procedureId: 'proc-1',
      procedureName: 'Consulta General',
      startTime: start,
      endTime: end,
    });

    expect(appointment).toBeDefined();
    expect(appointment.appointmentId).toContain('APT-');
    expect(appointment.status).toBe(AppointmentStatus.TENTATIVE);
  });

  it('debe rechazar la reserva si el horario está fuera de jornada', async () => {
    const start = new Date('2026-09-25T10:00:00.000Z'); // 05:00 COT
    const end = new Date('2026-09-25T11:00:00.000Z');

    await expect(
      service.bookAppointment({
        doctorEmail: 'dr@example.com',
        patientNationalId: '987654',
        patientFullName: 'Paciente Prueba',
        patientEmail: 'paciente@example.com',
        procedureId: 'proc-1',
        procedureName: 'Consulta General',
        startTime: start,
        endTime: end,
      })
    ).rejects.toThrow(RpcException);
  });

  it('debe rechazar la reserva si coincide con el almuerzo', async () => {
    const start = new Date('2026-09-25T17:30:00.000Z'); // 12:30 COT
    const end = new Date('2026-09-25T18:15:00.000Z');

    await expect(
      service.bookAppointment({
        doctorEmail: 'dr@example.com',
        patientNationalId: '987654',
        patientFullName: 'Paciente Prueba',
        patientEmail: 'paciente@example.com',
        procedureId: 'proc-1',
        procedureName: 'Consulta General',
        startTime: start,
        endTime: end,
      })
    ).rejects.toThrow(RpcException);
  });
});
