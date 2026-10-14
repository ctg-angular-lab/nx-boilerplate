import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AppointmentTrackingService } from './appointment-tracking.service';
import { MockCalendarAdapter } from '../adapters/mock-calendar.adapter';
import { AppointmentRepository } from '../repositories/appointment.repository';
import { RpcException } from '@nestjs/microservices';

describe('AppointmentTrackingService', () => {
  let service: AppointmentTrackingService;
  let mockCalendarAdapter: MockCalendarAdapter;
  let mockAppointmentRepository: AppointmentRepository;

  beforeEach(() => {
    mockCalendarAdapter = new MockCalendarAdapter();
    mockAppointmentRepository = {
      findById: vi.fn(),
      findDaily: vi.fn().mockResolvedValue([]),
      updateStatus: vi.fn(),
      incrementContactCount: vi.fn(),
    } as unknown as AppointmentRepository;

    service = new AppointmentTrackingService(
      mockAppointmentRepository,
      mockCalendarAdapter
    );
  });

  it('debe consultar citas diarias delegando en el repositorio con rango de día', async () => {
    const mockAppointments = [
      {
        appointmentId: 'APT-1',
        doctorEmail: 'dr@example.com',
        patientFullName: 'Ana Gómez',
        contactCount: 0,
      },
    ];
    vi.spyOn(mockAppointmentRepository, 'findDaily').mockResolvedValue(mockAppointments as any);

    const result = await service.getDailyAppointments({
      date: '2026-10-15',
      doctorEmail: 'dr@example.com',
      status: 'TENTATIVE',
    });

    expect(result).toEqual(mockAppointments);
    expect(mockAppointmentRepository.findDaily).toHaveBeenCalledWith(
      expect.objectContaining({
        doctorEmail: 'dr@example.com',
        status: 'TENTATIVE',
      })
    );
  });

  it('debe actualizar el estado de una cita sincronizando con Google Calendar y MongoDB', async () => {
    const existing = {
      appointmentId: 'APT-99',
      doctorEmail: 'dr@example.com',
      googleCalendarEventId: 'g-event-99',
      status: 'TENTATIVE',
    };
    const updated = {
      ...existing,
      status: 'CONFIRMED',
      colorId: '10',
    };

    vi.spyOn(mockAppointmentRepository, 'findById').mockResolvedValue(existing as any);
    const spyCalendarUpdate = vi.spyOn(mockCalendarAdapter, 'updateEventStatus');
    vi.spyOn(mockAppointmentRepository, 'updateStatus').mockResolvedValue(updated as any);

    const result = await service.updateAppointmentStatus('APT-99', 'CONFIRMED');

    expect(spyCalendarUpdate).toHaveBeenCalledWith('dr@example.com', 'g-event-99', 'CONFIRMED');
    expect(mockAppointmentRepository.updateStatus).toHaveBeenCalledWith('APT-99', 'CONFIRMED', '10');
    expect(result.status).toBe('CONFIRMED');
  });

  it('debe lanzar RpcException si la cita no existe al intentar actualizar estado', async () => {
    vi.spyOn(mockAppointmentRepository, 'findById').mockResolvedValue(null);

    await expect(
      service.updateAppointmentStatus('APT-NOT-FOUND', 'CONFIRMED')
    ).rejects.toThrow(RpcException);
  });

  it('debe incrementar el contador de contactos para una cita existente', async () => {
    const mockUpdated = {
      appointmentId: 'APT-100',
      contactCount: 2,
    };
    vi.spyOn(mockAppointmentRepository, 'incrementContactCount').mockResolvedValue(mockUpdated as any);

    const result = await service.incrementContactCount('APT-100');

    expect(mockAppointmentRepository.incrementContactCount).toHaveBeenCalledWith('APT-100');
    expect(result?.contactCount).toBe(2);
  });
});
