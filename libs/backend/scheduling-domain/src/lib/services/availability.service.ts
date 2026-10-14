import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  IDayAvailability,
  ISlotDisplay,
  SlotStatusType,
} from '@nx-boilerplate/api-interfaces';
import {
  CALENDAR_PROVIDER,
  ICalendarEventItem,
  ICalendarProvider,
  ITimeSlot,
} from '../ports/calendar-provider.port';
import { AppointmentRepository } from '../repositories/appointment.repository';
import { WorkScheduleService } from './work-schedule.service';
import {
  buildLunchWindow,
  buildWorkWindow,
  createCotDate,
  DAY_NAMES_ES,
  generateAvailableSlots,
  getCotDateString,
  getCotDayOfWeek,
  getCotTimeString,
  isWorkingDay,
} from '../utils/slot-calculator';

@Injectable()
export class AvailabilityService {
  private readonly logger = new Logger(AvailabilityService.name);

  constructor(
    private readonly workScheduleService: WorkScheduleService,
    @Inject(CALENDAR_PROVIDER)
    private readonly calendarProvider: ICalendarProvider,
    private readonly appointmentRepository: AppointmentRepository
  ) {}

  /**
   * Calcula los intervalos de tiempo disponibles para un día específico restando ocupaciones.
   */
  async getAvailableSlots(
    doctorEmail: string,
    doctorCedula: string,
    targetDate: Date,
    procedureDurationMinutes: number
  ): Promise<ITimeSlot[]> {
    const schedule = await this.workScheduleService.resolveProfessionalSchedule(
      doctorEmail,
      doctorCedula,
      true
    );
    const dateStr = getCotDateString(targetDate);

    if (!isWorkingDay(targetDate, schedule.diasLaborales)) {
      return [];
    }

    const { workStart, workEnd } = buildWorkWindow(dateStr, schedule);
    const lunch = buildLunchWindow(dateStr, schedule);

    const [calendarResult, mongoAppointments] = await Promise.all([
      this.calendarProvider.getBusyIntervals(doctorEmail, workStart, workEnd),
      this.appointmentRepository.findByDoctorAndDateRange(doctorEmail, workStart, workEnd),
    ]);

    const allBusyIntervals: ITimeSlot[] = [
      ...(lunch ? [{ start: lunch.lunchStart, end: lunch.lunchEnd }] : []),
      ...calendarResult.intervals,
      ...mongoAppointments.map((apt) => ({
        start: new Date(apt.startTime),
        end: new Date(apt.endTime),
      })),
    ];

    return generateAvailableSlots({
      workStart,
      workEnd,
      procedureDurationMinutes,
      busyIntervals: allBusyIntervals,
    });
  }

  /**
   * Consulta disponibilidad semanal optimizada con una única llamada a Google Calendar y Mongo.
   */
  async getAvailableSlotsForRange(
    doctorEmail: string,
    startDate: Date,
    endDate: Date,
    procedureDurationMinutes: number,
    doctorCedula?: string
  ): Promise<IDayAvailability[]> {
    const schedule = await this.workScheduleService.resolveProfessionalSchedule(
      doctorEmail,
      doctorCedula,
      true
    );
    const startStr = getCotDateString(startDate);
    const endStr = getCotDateString(endDate);
    const rangeStart = createCotDate(startStr, '00:00');
    const rangeEnd = new Date(createCotDate(endStr, '23:59').getTime() + 59999);

    let isCalendarSynced = true;
    const [googleEvents, mongoAppointments] = await Promise.all([
      this.calendarProvider.getEventsInRange(doctorEmail, rangeStart, rangeEnd).catch((err) => {
        this.logger.warn(`No se pudo sincronizar Google Calendar para ${doctorEmail}: ${err.message}`);
        isCalendarSynced = false;
        return [] as ICalendarEventItem[];
      }),
      this.appointmentRepository.findByDoctorAndDateRange(doctorEmail, rangeStart, rangeEnd),
    ]);

    const result: IDayAvailability[] = [];
    const slotDurationMs = procedureDurationMinutes * 60 * 1000;
    let currentDay = new Date(rangeStart);

    while (currentDay.getTime() <= rangeEnd.getTime()) {
      const dateStr = getCotDateString(currentDay);
      const dayOfWeek = getCotDayOfWeek(currentDay);
      const dayName = DAY_NAMES_ES[dayOfWeek];
      const isDayWorking = isWorkingDay(currentDay, schedule.diasLaborales);
      const daySlots: ISlotDisplay[] = [];

      if (isDayWorking) {
        const { workStart, workEnd } = buildWorkWindow(dateStr, schedule);
        const lunch = buildLunchWindow(dateStr, schedule);

        let currentSlotStart = new Date(workStart);
        while (currentSlotStart.getTime() + slotDurationMs <= workEnd.getTime()) {
          const currentSlotEnd = new Date(currentSlotStart.getTime() + slotDurationMs);
          const sH = getCotTimeString(currentSlotStart);
          const eH = getCotTimeString(currentSlotEnd);
          const display = `${sH} - ${eH}`;

          const matchingGoogle = googleEvents.find((evt) =>
            currentSlotStart.getTime() < evt.end.getTime() && currentSlotEnd.getTime() > evt.start.getTime()
          );

          const matchingMongo = mongoAppointments.find((apt) => {
            const aptStart = new Date(apt.startTime).getTime();
            const aptEnd = new Date(apt.endTime).getTime();
            return currentSlotStart.getTime() < aptEnd && currentSlotEnd.getTime() > aptStart;
          });

          const isLunch = lunch
            ? currentSlotStart.getTime() < lunch.lunchEnd.getTime() && currentSlotStart.getTime() > lunch.lunchStart.getTime()
            : false;

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
          } else if (currentSlotStart.getTime() < Date.now()) {
            daySlots.push({
              startTime: currentSlotStart.toISOString(),
              endTime: currentSlotEnd.toISOString(),
              display,
              title: 'Horario transcurrido',
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
        isCalendarSynced,
        isWorkingDay: isDayWorking,
        slots: daySlots,
      });

      currentDay = new Date(currentDay.getTime() + 24 * 60 * 60 * 1000);
    }

    return result;
  }
}
