import { ICreateAppointmentRequest } from '@nx-boilerplate/api-interfaces';

export interface IAgendarModalPatient {
  nombre: string;
  apellidos?: string;
  cedula?: string;
  correo?: string;
  celular?: string;
  [key: string]: unknown;
}

export interface AgendarModalData {
  title?: string;
  dateRange?: string;
  fecha?: string;
  professional?: string;
  profesional?: string;
  patient?: IAgendarModalPatient | ICreateAppointmentRequest | null;
}

export interface AgendarModalResult {
  agendar: boolean;
  notes?: string;
}
