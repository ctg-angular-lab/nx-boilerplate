import { IBookingPatient, SlotStatusType } from '@nx-boilerplate/api-interfaces';

export interface AgendarModalData {
  title?: string;
  dateRange?: string;
  professional?: string;
  patient?: IBookingPatient | null;
  /** Indica si el modal se abre en modo solo lectura para una cita tentativa existente */
  isTentativeView?: boolean;
  colorId?: string | null;
  notes?: string;
  /** Timestamps ISO para construcción de invites de calendario */
  startTime?: string | null;
  endTime?: string | null;
  /** Estado del slot ('TENTATIVE', 'CONFIRMED', etc.) */
  slotStatus?: SlotStatusType | null;
}

export interface AgendarModalResult {
  agendar: boolean;
  notes?: string;
  goToStepper?: boolean;
}

