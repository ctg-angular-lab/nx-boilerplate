import { Inject, Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { IDayAvailability, ISlotDisplay, SlotStatusType } from '@nx-boilerplate/api-interfaces';
import {
  CALENDAR_PROVIDER,
  ICalendarEventItem,
  ICalendarProvider,
  ITimeSlot,
} from '../ports/calendar-provider.port';
import { AppointmentRepository } from '../repositories/appointment.repository';
import { Appointment, AppointmentStatus } from '../schemas/appointment.schema';

export interface IBookAppointmentCommand {
  doctorEmail: string;
  doctorCedula: string;
  patientNationalId: string;
  patientFullName: string;
  patientEmail: string;
  patientPhone?: string;
  procedureId: string;
  procedureName: string;
  startTime: Date;
  endTime: Date;
  notes?: string;
}

@Injectable()
export class SchedulingDomainService {
  private readonly logger = new Logger(SchedulingDomainService.name);

  constructor(
    @Inject(CALENDAR_PROVIDER)
    private readonly calendarProvider: ICalendarProvider,
    private readonly appointmentRepository: AppointmentRepository
  ) {}

  /**
   * Calcula los intervalos de tiempo disponibles restando las ocupaciones de Google Calendar y MongoDB.
   */
  async getAvailableSlots(
    doctorEmail: string,
    _doctorCedula: string,
    targetDate: Date,
    procedureDurationMinutes: number
  ): Promise<ITimeSlot[]> {
    // 1. Delimitar jornada de trabajo (08:00 a 17:00 en fecha especificada)
    const workStart = new Date(targetDate);
    workStart.setHours(8, 0, 0, 0);

    const workEnd = new Date(targetDate);
    workEnd.setHours(17, 0, 0, 0);

    // Delimitar receso de almuerzo fijo (12:00 a 13:00)
    const lunchStart = new Date(targetDate);
    lunchStart.setHours(12, 0, 0, 0);
    const lunchEnd = new Date(targetDate);
    lunchEnd.setHours(13, 0, 0, 0);

    // 2. Consultar intervalos ocupados en Google Calendar y MongoDB en paralelo
    const [calendarResult, mongoAppointments] = await Promise.all([
      this.calendarProvider.getBusyIntervals(doctorEmail, workStart, workEnd),
      this.appointmentRepository.findByDoctorAndDateRange(doctorEmail, workStart, workEnd),
    ]);

    const googleBusy = calendarResult.intervals;

    // Consolidar todos los intervalos de bloqueo
    const allBusyIntervals: ITimeSlot[] = [
      { start: lunchStart, end: lunchEnd },
      ...googleBusy,
      ...mongoAppointments.map((apt) => ({
        start: new Date(apt.startTime),
        end: new Date(apt.endTime),
      })),
    ];

    // 3. Generar candidatos continuos de tamaño procedureDurationMinutes
    const availableSlots: ITimeSlot[] = [];
    const slotDurationMs = procedureDurationMinutes * 60 * 1000;
    let currentCandidateStart = new Date(workStart);

    while (currentCandidateStart.getTime() + slotDurationMs <= workEnd.getTime()) {
      const candidateEnd = new Date(currentCandidateStart.getTime() + slotDurationMs);

      // Comprobar colisión: existe colisión si candidateStart < busyEnd && candidateEnd > busyStart
      const hasOverlap = allBusyIntervals.some((busy) => {
        return (
          currentCandidateStart.getTime() < busy.end.getTime() &&
          candidateEnd.getTime() > busy.start.getTime()
        );
      });

      if (!hasOverlap) {
        availableSlots.push({
          start: new Date(currentCandidateStart),
          end: candidateEnd,
        });
      }

      // Avanzar al siguiente bloque
      currentCandidateStart = new Date(currentCandidateStart.getTime() + slotDurationMs);
    }

    return availableSlots;
  }

  /**
   * Calcula los slots disponibles agrupados por día para un rango de fechas (ej. semanal).
   * Realiza una única llamada a Google Calendar y a MongoDB para todo el rango.
   */
  async getAvailableSlotsForRange(
    doctorEmail: string,
    startDate: Date,
    endDate: Date,
    procedureDurationMinutes: number
  ): Promise<IDayAvailability[]> {
    // 1. Normalizar inicio y fin del rango completo
    const rangeStart = new Date(startDate);
    rangeStart.setHours(0, 0, 0, 0);

    const rangeEnd = new Date(endDate);
    rangeEnd.setHours(23, 59, 59, 999);

    // 2. Consulta de eventos en Google Calendar y MongoDB para todo el rango
    let isCalendarSynced = true;
    const [googleEvents, mongoAppointments] = await Promise.all([
      this.calendarProvider.getEventsInRange(doctorEmail, rangeStart, rangeEnd).catch((err) => {
        this.logger.warn(`No se pudo sincronizar Google Calendar para ${doctorEmail}: ${err.message}`);
        isCalendarSynced = false;
        return [] as ICalendarEventItem[];
      }),
      this.appointmentRepository.findByDoctorAndDateRange(doctorEmail, rangeStart, rangeEnd),
    ]);

    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const result: IDayAvailability[] = [];

    // 3. Iterar día por día entre startDate y endDate
    const currentDay = new Date(rangeStart);
    const slotDurationMs = procedureDurationMinutes * 60 * 1000;

    while (currentDay.getTime() <= rangeEnd.getTime()) {
      const year = currentDay.getFullYear();
      const month = String(currentDay.getMonth() + 1).padStart(2, '0');
      const day = String(currentDay.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      const dayOfWeek = currentDay.getDay();
      const dayName = dayNames[dayOfWeek];

      const daySlots: ISlotDisplay[] = [];

      // Domingo descanso (sin slots); Lunes a Sábado jornada operativa
      if (dayOfWeek !== 0) {
        // Jornada base: 07:00 a 19:00
        const workStart = new Date(currentDay);
        workStart.setHours(7, 0, 0, 0);

        const workEnd = new Date(currentDay);
        workEnd.setHours(19, 0, 0, 0);

        // Receso de almuerzo: 12:00 a 13:00
        const lunchStart = new Date(currentDay);
        lunchStart.setHours(12, 0, 0, 0);
        const lunchEnd = new Date(currentDay);
        lunchEnd.setHours(13, 0, 0, 0);

        let currentSlotStart = new Date(workStart);
        while (currentSlotStart.getTime() + slotDurationMs <= workEnd.getTime()) {
          const currentSlotEnd = new Date(currentSlotStart.getTime() + slotDurationMs);
          const startH = String(currentSlotStart.getHours()).padStart(2, '0');
          const startM = String(currentSlotStart.getMinutes()).padStart(2, '0');
          const endH = String(currentSlotEnd.getHours()).padStart(2, '0');
          const endM = String(currentSlotEnd.getMinutes()).padStart(2, '0');
          const display = `${startH}:${startM} - ${endH}:${endM}`;

          // Evaluar colisión contra eventos enriquecidos de Google Calendar
          const matchingGoogle = googleEvents.find((evt) => {
            return currentSlotStart.getTime() < evt.end.getTime() && currentSlotEnd.getTime() > evt.start.getTime();
          });

          // Evaluar colisión contra citas en MongoDB
          const matchingMongo = mongoAppointments.find((apt) => {
            const aptStart = new Date(apt.startTime).getTime();
            const aptEnd = new Date(apt.endTime).getTime();
            return currentSlotStart.getTime() < aptEnd && currentSlotEnd.getTime() > aptStart;
          });

          // Evaluar si es horario de almuerzo (12:00 a 13:00)
          const isLunch =
            currentSlotStart.getTime() < lunchEnd.getTime() && currentSlotEnd.getTime() > lunchStart.getTime();

          const matchedPatient = matchingMongo
            ? {
                cedula: matchingMongo.patientNationalId,
                nombre: matchingMongo.patientFullName,
                apellidos: '',
                correo: matchingMongo.patientEmail,
                celular: matchingMongo.patientPhone || '',
              }
            : undefined;

          if (matchingGoogle) {
            daySlots.push({
              startTime: currentSlotStart.toISOString(),
              endTime: currentSlotEnd.toISOString(),
              display,
              title: matchingGoogle.isCreatedByApp ? (matchingGoogle.summary || 'Cita Médica') : 'Espacio Cerrado',
              status: matchingGoogle.isCreatedByApp ? matchingGoogle.derivedStatus : 'BLOCKED_PERSONAL',
              colorId: matchingGoogle.isCreatedByApp ? matchingGoogle.colorId : null,
              isBookable: false,
              googleEventId: matchingGoogle.id,
              ...(matchingGoogle.isCreatedByApp && matchedPatient ? { patient: matchedPatient } : {}),
            });
          } else if (matchingMongo) {
            daySlots.push({
              startTime: currentSlotStart.toISOString(),
              endTime: currentSlotEnd.toISOString(),
              display,
              title: matchingMongo.procedureName || 'Cita Reservada',
              status: (matchingMongo.status as SlotStatusType) || 'CONFIRMED',
              colorId: matchingMongo.colorId || '5',
              isBookable: false,
              googleEventId: matchingMongo.googleCalendarEventId,
              ...(matchedPatient ? { patient: matchedPatient } : {}),
            });
          } else if (isLunch) {
            daySlots.push({
              startTime: currentSlotStart.toISOString(),
              endTime: currentSlotEnd.toISOString(),
              display,
              title: 'Almuerzo',
              status: 'BLOCKED_PERSONAL',
              colorId: null,
              isBookable: false,
            });
          } else {
            daySlots.push({
              startTime: currentSlotStart.toISOString(),
              endTime: currentSlotEnd.toISOString(),
              display,
              title: 'Espacio disponible',
              status: 'AVAILABLE',
              colorId: null,
              isBookable: true,
            });
          }

          currentSlotStart = new Date(currentSlotStart.getTime() + slotDurationMs);
        }
      }

      result.push({
        date: dateStr,
        dayName,
        slots: daySlots,
        isCalendarSynced,
      });

      // Avanzar al siguiente día
      currentDay.setDate(currentDay.getDate() + 1);
      currentDay.setHours(0, 0, 0, 0);
    }

    return result;
  }

  /**
   * Reserva una cita verificando disponibilidad previa, registrando en Google Calendar y persistiendo en MongoDB.
   */
  async bookAppointment(command: IBookAppointmentCommand): Promise<Appointment> {
    const start = new Date(command.startTime);
    const end = new Date(command.endTime);

    // 1. Validar que el intervalo no choque con eventos existentes
    const { intervals: busyIntervals } = await this.calendarProvider.getBusyIntervals(command.doctorEmail, start, end);
    const hasCollision = busyIntervals.some(
      (busy) => start.getTime() < busy.end.getTime() && end.getTime() > busy.start.getTime()
    );

    if (hasCollision) {
      throw new RpcException('El horario seleccionado ya no se encuentra disponible en Google Calendar');
    }

    // 2. Crear evento en Google Calendar
    const googleEventId = await this.calendarProvider.createEvent({
      doctorEmail: command.doctorEmail,
      patientEmail: command.patientEmail,
      patientFullName: command.patientFullName,
      patientNationalId: command.patientNationalId,
      patientPhone: command.patientPhone,
      procedureName: command.procedureName,
      startTime: start,
      endTime: end,
      notes: command.notes,
    });

    // 3. Persistir en MongoDB Atlas con compensación en caso de fallo
    try {
      const appointmentId = `APT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const appointment = await this.appointmentRepository.create({
        appointmentId,
        doctorEmail: command.doctorEmail,
        doctorCedula: command.doctorCedula,
        patientNationalId: command.patientNationalId,
        patientFullName: command.patientFullName,
        patientEmail: command.patientEmail,
        patientPhone: command.patientPhone,
        procedureId: command.procedureId,
        procedureName: command.procedureName,
        startTime: start,
        endTime: end,
        status: AppointmentStatus.TENTATIVE,
        colorId: '5',
        googleCalendarEventId: googleEventId,
        notes: command.notes,
      });

      this.logger.log(`Cita guardada en MongoDB Atlas: ${appointmentId}`);
      return appointment;
    } catch (mongoError) {
      this.logger.error(
        `[COMPENSACIÓN REQUERIDA] Error persistiendo en MongoDB tras crear evento en Google Calendar. EventId: ${googleEventId}. Detalle: ${(mongoError as Error).message}`
      );
      throw new RpcException(`Error guardando cita en base de datos: ${(mongoError as Error).message}`);
    }
  }

  /**
   * Obtiene las citas del día filtrando por rango de inicio y fin de jornada, email del doctor y estado opcional.
   */
  async getDailyAppointments(query: {
    date: string;
    doctorEmail?: string;
    status?: string;
  }): Promise<Appointment[]> {
    const [year, month, day] = query.date.split('-').map(Number);
    const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
    const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);

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

    // 1. Sincronizar en Google Calendar si existe evento asociado
    if (appointment.googleCalendarEventId && appointment.doctorEmail) {
      await this.calendarProvider.updateEventStatus(
        appointment.doctorEmail,
        appointment.googleCalendarEventId,
        status
      );
    }

    // 2. Transacción compensatoria básica: actualizar en MongoDB
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

