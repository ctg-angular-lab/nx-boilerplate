import { Injectable, Logger } from '@nestjs/common';
import {
  ICalendarProvider,
  ITimeSlot,
  ICreateAppointmentEvent,
} from '../ports/calendar-provider.port';

@Injectable()
export class MockCalendarAdapter implements ICalendarProvider {
  private readonly logger = new Logger(MockCalendarAdapter.name);

  async getBusyIntervals(calendarEmail: string, fromDate: Date, toDate: Date): Promise<ITimeSlot[]> {
    this.logger.log(
      `[MockCalendar] Retornando slots ocupados simulados para ${calendarEmail} entre ${fromDate.toISOString()} y ${toDate.toISOString()}`
    );
    // Simular ocupado durante el almuerzo (12:00 a 13:00) del día solicitado
    const lunchStart = new Date(fromDate);
    lunchStart.setHours(12, 0, 0, 0);

    const lunchEnd = new Date(fromDate);
    lunchEnd.setHours(13, 0, 0, 0);

    return [{ start: lunchStart, end: lunchEnd }];
  }

  async createEvent(eventData: ICreateAppointmentEvent): Promise<string> {
    const mockId = `mock-google-id-${Date.now()}`;
    this.logger.log(`[MockCalendar] Cita simulada creada para ${eventData.patientFullName}. Mock ID: ${mockId}`);
    return mockId;
  }
}
