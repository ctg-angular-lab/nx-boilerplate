import { SlotStatusType } from '@nx-boilerplate/api-interfaces';

export interface ITimeSlot {
  start: Date;
  end: Date;
}

/** Resultado de un evento procesado de Google Calendar */
export interface ICalendarEventItem {
  id: string;
  summary: string;
  start: Date;
  end: Date;
  colorId: string | null;
  isCreatedByApp: boolean;
  derivedStatus: Extract<SlotStatusType, 'TENTATIVE' | 'CONFIRMED'>;
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
  patientNationalId?: string;
  patientPhone?: string;
  procedureName: string;
  startTime: Date;
  endTime: Date;
  notes?: string;
}

export interface ICalendarProvider {
  /**
   * Obtiene eventos de Google Calendar mapeados con reglas de veto y estado derivado.
   * Filtra y excluye los evaluados como CANCELLED.
   */
  getEventsInRange(doctorEmail: string, fromDate: Date, toDate: Date): Promise<ICalendarEventItem[]>;

  /**
   * Consulta intervalos ocupados (busy).
   * Retorna también si la sincronización fue exitosa (isSynced).
   */
  getBusyIntervals(calendarEmail: string, fromDate: Date, toDate: Date): Promise<ICalendarBusyResult>;

  /**
   * Registra una cita en el calendario del médico y retorna el ID del evento creado.
   */
  createEvent(eventData: ICreateAppointmentEvent): Promise<string>;

  /**
   * Actualiza el estado y color de un evento en Google Calendar.
   */
  updateEventStatus(
    doctorEmail: string,
    eventId: string,
    status: 'CONFIRMED' | 'CANCELLED'
  ): Promise<void>;
}

export const CALENDAR_PROVIDER = Symbol('CALENDAR_PROVIDER');
