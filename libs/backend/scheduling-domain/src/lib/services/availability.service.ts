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

        const fixedBlocks: Array<{ start: Date; end: Date; slot: ISlotDisplay }> = [];
        const matchedGoogleIds = new Set<string>();

        // 1. Citas registradas en MongoDB (conservando su duración y límites exactos)
        const dayMongoAppointments = mongoAppointments.filter((apt) => {
          const aptStart = new Date(apt.startTime).getTime();
          const aptEnd = new Date(apt.endTime).getTime();
          return aptStart < workEnd.getTime() && aptEnd > workStart.getTime();
        });

        for (const apt of dayMongoAppointments) {
          const rawStart = new Date(apt.startTime);
          const rawEnd = new Date(apt.endTime);
          const blockStart = new Date(Math.max(rawStart.getTime(), workStart.getTime()));
          const blockEnd = new Date(Math.min(rawEnd.getTime(), workEnd.getTime()));
          if (blockEnd.getTime() <= blockStart.getTime()) continue;

          const matchingGoogle = googleEvents.find(
            (evt) =>
              (apt.googleCalendarEventId && evt.id === apt.googleCalendarEventId) ||
              (evt.isCreatedByApp &&
                evt.start.getTime() < blockEnd.getTime() &&
                evt.end.getTime() > blockStart.getTime())
          );

          if (matchingGoogle?.id) {
            matchedGoogleIds.add(matchingGoogle.id);
          }

          const sH = getCotTimeString(blockStart);
          const eH = getCotTimeString(blockEnd);
          const durationMinutes = Math.max(
            5,
            Math.round((blockEnd.getTime() - blockStart.getTime()) / 60000)
          );

          const matchedPatient = {
            cedula: apt.patientNationalId,
            nombre: apt.patientFullName,
            apellidos: '',
            correo: apt.patientEmail,
            celular: apt.patientPhone || '',
          };

          const resolvedStatus: SlotStatusType = matchingGoogle?.isCreatedByApp
            ? matchingGoogle.derivedStatus
            : (apt.status as SlotStatusType) || 'CONFIRMED';

          const resolvedColorId = matchingGoogle?.isCreatedByApp
            ? matchingGoogle.colorId
            : apt.colorId || (resolvedStatus === 'CONFIRMED' ? '10' : '5');

          const resolvedTitle = matchingGoogle?.isCreatedByApp
            ? matchingGoogle.summary || apt.procedureName || 'Cita Médica'
            : apt.procedureName || 'Cita Reservada';

          fixedBlocks.push({
            start: blockStart,
            end: blockEnd,
            slot: {
              startTime: blockStart.toISOString(),
              endTime: blockEnd.toISOString(),
              display: `${sH} - ${eH}`,
              durationMinutes,
              title: resolvedTitle,
              status: resolvedStatus,
              colorId: resolvedColorId,
              isBookable: false,
              googleEventId: matchingGoogle?.id || apt.googleCalendarEventId,
              patient: matchedPatient,
            },
          });
        }

        // 2. Eventos de Google Calendar no emparejados previamente con Mongo
        const dayGoogleEvents = googleEvents.filter(
          (evt) =>
            !matchedGoogleIds.has(evt.id) &&
            evt.start.getTime() < workEnd.getTime() &&
            evt.end.getTime() > workStart.getTime()
        );

        for (const evt of dayGoogleEvents) {
          const blockStart = new Date(Math.max(evt.start.getTime(), workStart.getTime()));
          const blockEnd = new Date(Math.min(evt.end.getTime(), workEnd.getTime()));
          if (blockEnd.getTime() <= blockStart.getTime()) continue;

          // Evitar duplicar si ya colisiona completamente con una cita de Mongo
          const overlapsExisting = fixedBlocks.some(
            (b) =>
              blockStart.getTime() < b.end.getTime() &&
              blockEnd.getTime() > b.start.getTime()
          );
          if (overlapsExisting) continue;

          const sH = getCotTimeString(blockStart);
          const eH = getCotTimeString(blockEnd);
          const durationMinutes = Math.max(
            5,
            Math.round((blockEnd.getTime() - blockStart.getTime()) / 60000)
          );

          fixedBlocks.push({
            start: blockStart,
            end: blockEnd,
            slot: {
              startTime: blockStart.toISOString(),
              endTime: blockEnd.toISOString(),
              display: `${sH} - ${eH}`,
              durationMinutes,
              title: evt.isCreatedByApp ? evt.summary || 'Cita Médica' : 'Espacio Cerrado',
              status: evt.isCreatedByApp ? evt.derivedStatus : 'BLOCKED_PERSONAL',
              colorId: evt.isCreatedByApp ? evt.colorId : null,
              isBookable: false,
              googleEventId: evt.id,
            },
          });
        }

        // 3. Ventana de almuerzo (si no colisiona con una cita ya agendada)
        if (
          lunch &&
          lunch.lunchStart.getTime() < workEnd.getTime() &&
          lunch.lunchEnd.getTime() > workStart.getTime()
        ) {
          const lunchStart = new Date(Math.max(lunch.lunchStart.getTime(), workStart.getTime()));
          const lunchEnd = new Date(Math.min(lunch.lunchEnd.getTime(), workEnd.getTime()));
          const overlapsAppointment = fixedBlocks.some(
            (b) =>
              lunchStart.getTime() < b.end.getTime() &&
              lunchEnd.getTime() > b.start.getTime()
          );

          if (!overlapsAppointment && lunchEnd.getTime() > lunchStart.getTime()) {
            const sH = getCotTimeString(lunchStart);
            const eH = getCotTimeString(lunchEnd);
            const durationMinutes = Math.max(
              5,
              Math.round((lunchEnd.getTime() - lunchStart.getTime()) / 60000)
            );
            fixedBlocks.push({
              start: lunchStart,
              end: lunchEnd,
              slot: {
                startTime: lunchStart.toISOString(),
                endTime: lunchEnd.toISOString(),
                display: `${sH} - ${eH}`,
                durationMinutes,
                title: 'Almuerzo',
                status: 'BLOCKED_PERSONAL',
                colorId: null,
                isBookable: false,
              },
            });
          }
        }

        // Ordenar bloques fijos cronológicamente
        fixedBlocks.sort((a, b) => a.start.getTime() - b.start.getTime());

        // 4. Rellenar las ventanas libres entre workStart, bloques fijos y workEnd con slots de procedureDurationMinutes
        const fillFreeWindow = (gapStart: Date, gapEnd: Date): void => {
          let currentSlotStart = new Date(gapStart);
          while (currentSlotStart.getTime() + slotDurationMs <= gapEnd.getTime()) {
            const currentSlotEnd = new Date(currentSlotStart.getTime() + slotDurationMs);
            const sH = getCotTimeString(currentSlotStart);
            const eH = getCotTimeString(currentSlotEnd);
            const display = `${sH} - ${eH}`;

            if (currentSlotStart.getTime() < Date.now()) {
              daySlots.push({
                startTime: currentSlotStart.toISOString(),
                endTime: currentSlotEnd.toISOString(),
                display,
                durationMinutes: procedureDurationMinutes,
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
                durationMinutes: procedureDurationMinutes,
                title: 'Espacio disponible',
                status: 'AVAILABLE',
                colorId: null,
                isBookable: true,
              });
            }

            currentSlotStart = currentSlotEnd;
          }

          // Si queda un remanente >= 5 min donde no cabe el procedimiento completo, marcarlo como cerrado/transcurrido
          const remnantMs = gapEnd.getTime() - currentSlotStart.getTime();
          if (remnantMs >= 5 * 60 * 1000) {
            const sH = getCotTimeString(currentSlotStart);
            const eH = getCotTimeString(gapEnd);
            const remnantMinutes = Math.round(remnantMs / 60000);
            const isPastRemnant = currentSlotStart.getTime() < Date.now();
            daySlots.push({
              startTime: currentSlotStart.toISOString(),
              endTime: gapEnd.toISOString(),
              display: `${sH} - ${eH}`,
              durationMinutes: remnantMinutes,
              title: isPastRemnant ? 'Horario transcurrido' : 'Espacio Cerrado',
              status: 'BLOCKED_PERSONAL',
              colorId: null,
              isBookable: false,
            });
          }
        };

        let cursor = new Date(workStart);
        for (const block of fixedBlocks) {
          if (block.start.getTime() > cursor.getTime()) {
            fillFreeWindow(cursor, block.start);
          }
          daySlots.push(block.slot);
          if (block.end.getTime() > cursor.getTime()) {
            cursor = new Date(block.end);
          }
        }

        if (workEnd.getTime() > cursor.getTime()) {
          fillFreeWindow(cursor, workEnd);
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
