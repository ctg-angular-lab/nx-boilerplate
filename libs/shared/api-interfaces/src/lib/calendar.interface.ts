export type SlotStatus = 'disponible' | 'reservado' | 'seleccionado';

export interface TimeSlot {
  id: string;
  time: string;
  status: SlotStatus;
  reservedBy?: string;
}

export interface CalendarDay {
  date: Date;
  label: string;
  subLabel: string;
  slots: TimeSlot[];
  isToday: boolean;
  isAvailable?: boolean;
  isPast?: boolean;
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

