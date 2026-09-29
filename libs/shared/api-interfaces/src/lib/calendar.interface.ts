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
}

