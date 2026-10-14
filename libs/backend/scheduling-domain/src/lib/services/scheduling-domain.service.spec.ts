import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SchedulingDomainService } from './scheduling-domain.service';
import { WorkScheduleService } from './work-schedule.service';
import { AvailabilityService } from './availability.service';
import { BookingService } from './booking.service';
import { AppointmentTrackingService } from './appointment-tracking.service';
import { AppointmentStatus } from '../schemas/appointment.schema';

describe('SchedulingDomainService (Strangler Facade)', () => {
  let facade: SchedulingDomainService;
  let mockWorkScheduleService: WorkScheduleService;
  let mockAvailabilityService: AvailabilityService;
  let mockBookingService: BookingService;
  let mockTrackingService: AppointmentTrackingService;

  beforeEach(() => {
    mockWorkScheduleService = {
      resolveProfessionalSchedule: vi.fn().mockResolvedValue({
        diasLaborales: ['LUNES', 'MARTES'],
        horaInicio: '08:00',
        horaFin: '17:00',
      }),
    } as unknown as WorkScheduleService;

    mockAvailabilityService = {
      getAvailableSlots: vi.fn().mockResolvedValue([]),
      getAvailableSlotsForRange: vi.fn().mockResolvedValue([]),
    } as unknown as AvailabilityService;

    mockBookingService = {
      bookAppointment: vi.fn().mockResolvedValue({
        appointmentId: 'APT-123',
        status: AppointmentStatus.TENTATIVE,
      } as any),
    } as unknown as BookingService;

    mockTrackingService = {
      getDailyAppointments: vi.fn().mockResolvedValue([]),
      updateAppointmentStatus: vi.fn().mockResolvedValue({
        appointmentId: 'APT-123',
        status: 'CONFIRMED',
      } as any),
      incrementContactCount: vi.fn().mockResolvedValue({
        appointmentId: 'APT-123',
        contactCount: 1,
      } as any),
    } as unknown as AppointmentTrackingService;

    facade = new SchedulingDomainService(
      mockWorkScheduleService,
      mockAvailabilityService,
      mockBookingService,
      mockTrackingService
    );
  });

  it('debe delegar resolveProfessionalSchedule en WorkScheduleService', async () => {
    await facade.resolveProfessionalSchedule('dr@example.com', '123', true);
    expect(mockWorkScheduleService.resolveProfessionalSchedule).toHaveBeenCalledWith(
      'dr@example.com',
      '123',
      true
    );
  });

  it('debe delegar getAvailableSlots en AvailabilityService', async () => {
    const date = new Date('2026-09-25T12:00:00.000Z');
    await facade.getAvailableSlots('dr@example.com', '123', date, 45);
    expect(mockAvailabilityService.getAvailableSlots).toHaveBeenCalledWith(
      'dr@example.com',
      '123',
      date,
      45
    );
  });

  it('debe delegar getAvailableSlotsForRange en AvailabilityService', async () => {
    const start = new Date('2026-09-21T12:00:00.000Z');
    const end = new Date('2026-09-27T12:00:00.000Z');
    await facade.getAvailableSlotsForRange('dr@example.com', start, end, 45, '123');
    expect(mockAvailabilityService.getAvailableSlotsForRange).toHaveBeenCalledWith(
      'dr@example.com',
      start,
      end,
      45,
      '123'
    );
  });

  it('debe delegar bookAppointment en BookingService', async () => {
    const command = {
      doctorEmail: 'dr@example.com',
      patientNationalId: '123',
      patientFullName: 'Paciente',
      patientEmail: 'paciente@example.com',
      procedureId: 'proc-1',
      procedureName: 'Consulta',
      startTime: new Date(),
      endTime: new Date(),
    };
    const result = await facade.bookAppointment(command);
    expect(mockBookingService.bookAppointment).toHaveBeenCalledWith(command);
    expect(result.appointmentId).toBe('APT-123');
  });

  it('debe delegar getDailyAppointments en AppointmentTrackingService', async () => {
    const query = { date: '2026-10-15', doctorEmail: 'dr@example.com' };
    await facade.getDailyAppointments(query);
    expect(mockTrackingService.getDailyAppointments).toHaveBeenCalledWith(query);
  });

  it('debe delegar updateAppointmentStatus en AppointmentTrackingService', async () => {
    await facade.updateAppointmentStatus('APT-123', 'CONFIRMED');
    expect(mockTrackingService.updateAppointmentStatus).toHaveBeenCalledWith(
      'APT-123',
      'CONFIRMED'
    );
  });

  it('debe delegar incrementContactCount en AppointmentTrackingService', async () => {
    await facade.incrementContactCount('APT-123');
    expect(mockTrackingService.incrementContactCount).toHaveBeenCalledWith('APT-123');
  });
});
