import { Injectable, Logger } from '@nestjs/common';
import {
  ICalendarProvider,
  ICalendarBusyResult,
  ICalendarEventItem,
  ICreateAppointmentEvent,
} from '../ports/calendar-provider.port';

@Injectable()
export class MockCalendarAdapter implements ICalendarProvider {
  private readonly logger = new Logger(MockCalendarAdapter.name);

  async getEventsInRange(doctorEmail: string, fromDate: Date, toDate: Date): Promise<ICalendarEventItem[]> {
    this.logger.log(
      `[MockCalendar] Retornando eventos simulados para ${doctorEmail} entre ${fromDate.toISOString()} y ${toDate.toISOString()}`
    );
    const lunchStart = new Date(fromDate);
    lunchStart.setHours(12, 0, 0, 0);

    const lunchEnd = new Date(fromDate);
    lunchEnd.setHours(13, 0, 0, 0);

    return [
      {
        id: 'mock-lunch-event',
        summary: 'Almuerzo / Bloqueo Personal',
        start: lunchStart,
        end: lunchEnd,
        colorId: null,
        isCreatedByApp: false,
        derivedStatus: 'CONFIRMED',
      },
    ];
  }

  async getBusyIntervals(calendarEmail: string, fromDate: Date, toDate: Date): Promise<ICalendarBusyResult> {
    const events = await this.getEventsInRange(calendarEmail, fromDate, toDate);
    return {
      intervals: events.map((e) => ({ start: e.start, end: e.end })),
      isSynced: true,
    };
  }

  async createEvent(eventData: ICreateAppointmentEvent): Promise<string> {
    const mockId = `mock-google-id-${Date.now()}`;
    this.logger.log(`[MockCalendar] Cita simulada creada para ${eventData.patientFullName}. Mock ID: ${mockId}`);
    return mockId;
  }
}
