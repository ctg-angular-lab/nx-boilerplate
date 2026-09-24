import { Inject, Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { IDayAvailability, ISlotDisplay } from '@nx-boilerplate/api-interfaces';
import {
  CALENDAR_PROVIDER,
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
    const [googleBusy, mongoAppointments] = await Promise.all([
      this.calendarProvider.getBusyIntervals(doctorEmail, workStart, workEnd),
      this.appointmentRepository.findByDoctorAndDateRange(doctorEmail, workStart, workEnd),
    ]);

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

    // 2. Consulta ÚNICA a Google Calendar y MongoDB para todo el rango
    const [googleBusy, mongoAppointments] = await Promise.all([
      this.calendarProvider.getBusyIntervals(doctorEmail, rangeStart, rangeEnd),
      this.appointmentRepository.findByDoctorAndDateRange(doctorEmail, rangeStart, rangeEnd),
    ]);

    const allBusyIntervals: ITimeSlot[] = [
      ...googleBusy,
      ...mongoAppointments.map((apt) => ({
        start: new Date(apt.startTime),
        end: new Date(apt.endTime),
      })),
    ];

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

        const dayBusy = [
          { start: lunchStart, end: lunchEnd },
          ...allBusyIntervals.filter((busy) => {
            return busy.start.getTime() < workEnd.getTime() && busy.end.getTime() > workStart.getTime();
          }),
        ];

        let currentSlotStart = new Date(workStart);
        while (currentSlotStart.getTime() + slotDurationMs <= workEnd.getTime()) {
          const currentSlotEnd = new Date(currentSlotStart.getTime() + slotDurationMs);

          const hasOverlap = dayBusy.some((busy) => {
            return (
              currentSlotStart.getTime() < busy.end.getTime() &&
              currentSlotEnd.getTime() > busy.start.getTime()
            );
          });

          if (!hasOverlap) {
            const startH = String(currentSlotStart.getHours()).padStart(2, '0');
            const startM = String(currentSlotStart.getMinutes()).padStart(2, '0');
            const endH = String(currentSlotEnd.getHours()).padStart(2, '0');
            const endM = String(currentSlotEnd.getMinutes()).padStart(2, '0');

            daySlots.push({
              startTime: currentSlotStart.toISOString(),
              endTime: currentSlotEnd.toISOString(),
              display: `${startH}:${startM} - ${endH}:${endM}`,
            });
          }

          currentSlotStart = new Date(currentSlotStart.getTime() + slotDurationMs);
        }
      }

      result.push({
        date: dateStr,
        dayName,
        slots: daySlots,
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
    const busyIntervals = await this.calendarProvider.getBusyIntervals(command.doctorEmail, start, end);
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
        procedureId: command.procedureId,
        procedureName: command.procedureName,
        startTime: start,
        endTime: end,
        status: AppointmentStatus.CONFIRMED,
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
}
