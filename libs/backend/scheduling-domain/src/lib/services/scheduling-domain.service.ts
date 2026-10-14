import { Injectable } from '@nestjs/common';
import {
  IDayAvailability,
  IWorkSchedule,
} from '@nx-boilerplate/api-interfaces';
import { ITimeSlot } from '../ports/calendar-provider.port';
import { Appointment } from '../schemas/appointment.schema';
import { WorkScheduleService } from './work-schedule.service';
import { AvailabilityService } from './availability.service';
import { BookingService, IBookAppointmentCommand } from './booking.service';
import { AppointmentTrackingService } from './appointment-tracking.service';

export { IBookAppointmentCommand } from './booking.service';

/**
 * Fachada unificada de SchedulingDomainService (Patrón Strangler Fig).
 * Mantiene la compatibilidad hacia atrás delegando en los servicios especializados de dominio:
 * - WorkScheduleService
 * - AvailabilityService
 * - BookingService
 * - AppointmentTrackingService
 */
@Injectable()
export class SchedulingDomainService {
  constructor(
    private readonly workScheduleService: WorkScheduleService,
    private readonly availabilityService: AvailabilityService,
    private readonly bookingService: BookingService,
    private readonly appointmentTrackingService: AppointmentTrackingService
  ) {}

  /**
   * Resuelve el horario configurado del especialista médico.
   */
  async resolveProfessionalSchedule(
    doctorEmail?: string,
    doctorCedula?: string,
    allowFallback = true
  ): Promise<IWorkSchedule> {
    return this.workScheduleService.resolveProfessionalSchedule(
      doctorEmail,
      doctorCedula,
      allowFallback
    );
  }

  /**
   * Calcula los intervalos de tiempo disponibles para un día específico restando ocupaciones.
   */
  async getAvailableSlots(
    doctorEmail: string,
    doctorCedula: string,
    targetDate: Date,
    procedureDurationMinutes: number
  ): Promise<ITimeSlot[]> {
    return this.availabilityService.getAvailableSlots(
      doctorEmail,
      doctorCedula,
      targetDate,
      procedureDurationMinutes
    );
  }

  /**
   * Consulta disponibilidad semanal optimizada para un rango de fechas.
   */
  async getAvailableSlotsForRange(
    doctorEmail: string,
    startDate: Date,
    endDate: Date,
    procedureDurationMinutes: number,
    doctorCedula?: string
  ): Promise<IDayAvailability[]> {
    return this.availabilityService.getAvailableSlotsForRange(
      doctorEmail,
      startDate,
      endDate,
      procedureDurationMinutes,
      doctorCedula
    );
  }

  /**
   * Reserva una cita verificando disponibilidad previa, registrando en Google Calendar y persistiendo en MongoDB.
   */
  async bookAppointment(command: IBookAppointmentCommand): Promise<Appointment> {
    return this.bookingService.bookAppointment(command);
  }

  /**
   * Obtiene las citas del día filtrando por fecha, médico y estado.
   */
  async getDailyAppointments(query: {
    date: string;
    doctorEmail?: string;
    status?: string;
  }): Promise<Appointment[]> {
    return this.appointmentTrackingService.getDailyAppointments(query);
  }

  /**
   * Actualiza el estado de la cita sincronizando con Google Calendar y persistiendo en MongoDB.
   */
  async updateAppointmentStatus(
    appointmentId: string,
    status: 'CONFIRMED' | 'CANCELLED'
  ): Promise<Appointment> {
    return this.appointmentTrackingService.updateAppointmentStatus(appointmentId, status);
  }

  /**
   * Incrementa atómicamente el contador de contactos para una cita.
   */
  async incrementContactCount(appointmentId: string): Promise<Appointment | null> {
    return this.appointmentTrackingService.incrementContactCount(appointmentId);
  }
}
