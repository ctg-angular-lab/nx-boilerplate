export interface ITimeSlot {
  start: Date;
  end: Date;
}

export interface ICreateAppointmentEvent {
  doctorEmail: string;
  patientEmail: string;
  patientFullName: string;
  procedureName: string;
  startTime: Date;
  endTime: Date;
  notes?: string;
}

export interface ICalendarProvider {
  /**
   * Consulta intervalos ocupados (busy) mediante el endpoint freebusy de Google Calendar.
   */
  getBusyIntervals(calendarEmail: string, fromDate: Date, toDate: Date): Promise<ITimeSlot[]>;

  /**
   * Registra una cita en el calendario del médico y retorna el ID del evento creado.
   */
  createEvent(eventData: ICreateAppointmentEvent): Promise<string>;
}

export const CALENDAR_PROVIDER = Symbol('CALENDAR_PROVIDER');
