export interface ITimeSlot {
  start: Date;
  end: Date;
}

/** Resultado de consultar el calendario de un médico */
export interface ICalendarBusyResult {
  /** Intervalos de tiempo bloqueados en el calendario */
  intervals: ITimeSlot[];
  /**
   * true  → el bot pudo leer el calendario correctamente (integrado y compartido)
   * false → el bot NO tiene acceso al calendario (no compartido o error de permisos)
   */
  isSynced: boolean;
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
   * Retorna también si la sincronización fue exitosa (isSynced).
   */
  getBusyIntervals(calendarEmail: string, fromDate: Date, toDate: Date): Promise<ICalendarBusyResult>;

  /**
   * Registra una cita en el calendario del médico y retorna el ID del evento creado.
   */
  createEvent(eventData: ICreateAppointmentEvent): Promise<string>;
}

export const CALENDAR_PROVIDER = Symbol('CALENDAR_PROVIDER');
