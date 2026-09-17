export interface IAvailableDate {
  id: string;
  fecha: string;
  hora: string;
  profesional?: string;
  disponible: boolean;
}

export interface IMedicalProcedureOption {
  id: string;
  nombre: string;
  duracion: string;
  especialidad: string;
}

export interface ICreateAppointmentRequest {
  cedula: string;
  nombre: string;
  apellidos: string;
  correo: string;
  celular: string;
  recordatorioWhatsapp: boolean;
  procedimientoId: string;
  slotId?: string;
  fecha?: string;
  hora?: string;
}

export interface ICreateWaitlistRequest {
  cedula: string;
  nombre: string;
  apellidos: string;
  correo: string;
  celular: string;
  procedimientoId: string;
}
