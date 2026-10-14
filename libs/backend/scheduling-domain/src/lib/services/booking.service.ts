import { Inject, Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import {
  CALENDAR_PROVIDER,
  ICalendarProvider,
} from '../ports/calendar-provider.port';
import { AppointmentRepository } from '../repositories/appointment.repository';
import { Appointment, AppointmentStatus } from '../schemas/appointment.schema';
import { WorkScheduleService } from './work-schedule.service';
import {
  buildLunchWindow,
  buildWorkWindow,
  DAY_NAMES_ES,
  getCotDateString,
  getCotDayOfWeek,
  isOverlapping,
  isWorkingDay,
} from '../utils/slot-calculator';

export interface IBookAppointmentCommand {
  doctorEmail: string;
  doctorCedula?: string;
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
export class BookingService {
  private readonly logger = new Logger(BookingService.name);

  constructor(
    private readonly workScheduleService: WorkScheduleService,
    @Inject(CALENDAR_PROVIDER)
    private readonly calendarProvider: ICalendarProvider,
    private readonly appointmentRepository: AppointmentRepository
  ) {}

  /**
   * Reserva una cita verificando disponibilidad previa, registrando en Google Calendar y persistiendo en MongoDB.
   */
  async bookAppointment(command: IBookAppointmentCommand): Promise<Appointment> {
    const start = new Date(command.startTime);
    const end = new Date(command.endTime);

    const schedule = await this.workScheduleService.resolveProfessionalSchedule(
      command.doctorEmail,
      command.doctorCedula,
      false
    );

    const dateStr = getCotDateString(start);
    const dayOfWeek = getCotDayOfWeek(start);

    if (!isWorkingDay(start, schedule.diasLaborales)) {
      throw new RpcException(`El profesional no labora los días ${DAY_NAMES_ES[dayOfWeek].toLowerCase()}`);
    }

    const { workStart, workEnd } = buildWorkWindow(dateStr, schedule);
    if (start.getTime() < workStart.getTime() || end.getTime() > workEnd.getTime()) {
      throw new RpcException('El horario seleccionado está fuera de la jornada laboral del profesional');
    }

    const lunch = buildLunchWindow(dateStr, schedule);
    if (lunch && start.getTime() < lunch.lunchEnd.getTime() && end.getTime() > lunch.lunchStart.getTime()) {
      throw new RpcException('El horario seleccionado coincide con el receso de almuerzo del profesional');
    }

    const { intervals: busyIntervals } = await this.calendarProvider.getBusyIntervals(
      command.doctorEmail,
      start,
      end
    );
    if (isOverlapping(start, end, busyIntervals)) {
      throw new RpcException('El horario seleccionado ya no se encuentra disponible en Google Calendar');
    }

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
}
