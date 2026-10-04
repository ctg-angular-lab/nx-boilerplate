export type SlotStatus = 'disponible' | 'reservado' | 'seleccionado';

export interface TimeSlot {
  id: string;
  time: string;
  status: SlotStatus;
  reservedBy?: string;
  /** Cantidad de slots de 45 min que agrupa este bloque (solo en slots 'reservado' fusionados > 1) */
  mergedCount?: number;
  /** Timestamp ISO 8601 de inicio (requerido para crear la cita médica) */
  startTime?: string;
  /** Timestamp ISO 8601 de fin (requerido para crear la cita médica) */
  endTime?: string;
}

export interface CalendarDay {
  date: Date;
  label: string;
  subLabel: string;
  slots: TimeSlot[];
  isToday: boolean;
  isAvailable?: boolean;
  isPast?: boolean;
  /** false cuando el bot no tiene acceso al calendario del médico */
  isCalendarSynced?: boolean;
  /** Email del médico, usado para el mensaje de placeholder de no sincronizado */
  doctorEmail?: string;
}

export interface IAvailableWeekRange {
  weekStart: string; // Formato ISO YYYY-MM-DD
  weekEnd: string;   // Formato ISO YYYY-MM-DD
  hasAvailableSlots: boolean;
  totalAvailableSlots?: number;
}

export interface IAvailableWeekRangesResponse {
  professionalCedula: string;
  ranges: IAvailableWeekRange[];
}

