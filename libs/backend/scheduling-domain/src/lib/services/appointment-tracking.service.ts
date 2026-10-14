import { Inject, Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import {
  CALENDAR_PROVIDER,
  ICalendarProvider,
} from '../ports/calendar-provider.port';
import { AppointmentRepository } from '../repositories/appointment.repository';
import { Appointment } from '../schemas/appointment.schema';
import { createCotDate } from '../utils/slot-calculator';

@Injectable()
export class AppointmentTrackingService {
  private readonly logger = new Logger(AppointmentTrackingService.name);

  constructor(
    private readonly appointmentRepository: AppointmentRepository,
    @Inject(CALENDAR_PROVIDER)
    private readonly calendarProvider: ICalendarProvider
  ) {}

  /**
   * Obtiene las citas del día filtrando por rango de inicio y fin de jornada, email del doctor y estado opcional.
   */
  async getDailyAppointments(query: {
    date: string;
    doctorEmail?: string;
    status?: string;
  }): Promise<Appointment[]> {
    const startOfDay = createCotDate(query.date, '00:00');
    const endOfDay = new Date(createCotDate(query.date, '23:59').getTime() + 59999);

    return this.appointmentRepository.findDaily({
      startOfDay,
      endOfDay,
      doctorEmail: query.doctorEmail,
      status: query.status,
    });
  }

  /**
   * Actualiza el estado de la cita sincronizando con Google Calendar y persistiendo en MongoDB.
   */
  async updateAppointmentStatus(
    appointmentId: string,
    status: 'CONFIRMED' | 'CANCELLED'
  ): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findById(appointmentId);
    if (!appointment) {
      throw new RpcException({
        statusCode: 404,
        message: `Cita con identificador ${appointmentId} no encontrada`,
      });
    }

    const newColorId = status === 'CONFIRMED' ? '10' : '11';

    if (appointment.googleCalendarEventId && appointment.doctorEmail) {
      try {
        await this.calendarProvider.updateEventStatus(
          appointment.doctorEmail,
          appointment.googleCalendarEventId,
          status
        );
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        this.logger.warn(`No se pudo actualizar evento en Google Calendar: ${errorMsg}`);
      }
    }

    try {
      const updated = await this.appointmentRepository.updateStatus(
        appointmentId,
        status,
        newColorId
      );
      if (!updated) {
        throw new Error('No se pudo actualizar la cita en la base de datos');
      }
      this.logger.log(`Estado de cita ${appointmentId} actualizado a ${status} (colorId: ${newColorId})`);
      return updated;
    } catch (dbError) {
      this.logger.error(
        `[FALLO COMPENSACIÓN] Error al actualizar estado en Mongo tras Google Calendar. Appointment: ${appointmentId}`,
        (dbError as Error).stack
      );
      throw new RpcException(`Error al actualizar estado en base de datos: ${(dbError as Error).message}`);
    }
  }

  /**
   * Incrementa atómicamente el contador de contactos para una cita.
   */
  async incrementContactCount(appointmentId: string): Promise<Appointment | null> {
    const updated = await this.appointmentRepository.incrementContactCount(appointmentId);
    if (!updated) {
      this.logger.warn(`No se encontró la cita ${appointmentId} para incrementar contador de contactos`);
      return null;
    }
    this.logger.log(`Contacto registrado para cita ${appointmentId}. Total contactos: ${updated.contactCount}`);
    return updated;
  }
}
