import { IBookingPatient } from '@nx-boilerplate/api-interfaces';

export interface AgendarModalData {
  title?: string;
  dateRange?: string;
  professional?: string;
  patient?: IBookingPatient | null;
}

export interface AgendarModalResult {
  agendar: boolean;
  notes?: string;
}

