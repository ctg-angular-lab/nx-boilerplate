export type SlotStatus = 'disponible' | 'reservado' | 'seleccionado';

export interface TimeSlot {
  id: string;
  time: string;
  status: SlotStatus;
  reservedBy?: string;
  /** Cantidad de slots de 45 min que agrupa este bloque (solo en slots 'reservado' fusionados > 1) */
  mergedCount?: number;
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

