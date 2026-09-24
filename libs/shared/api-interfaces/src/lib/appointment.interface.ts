export interface ISlotDisplay {
  startTime: string;
  endTime: string;
  display: string;
}

export interface IDayAvailability {
  date: string;
  dayName: string;
  slots: ISlotDisplay[];
}

export interface IGetAvailableDatesRequest {
  procedureId?: string;
  doctorEmail?: string;
  doctorCedula?: string;
  targetDate?: string;
  startDate?: string;
  endDate?: string;
}

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
  procedimientoNombre?: string;
  slotId?: string;
  fecha?: string;
  hora?: string;
  notes?: string;
}

export interface ICreateWaitlistRequest {
  cedula: string;
  nombre: string;
  apellidos: string;
  correo: string;
  celular: string;
  procedimientoId: string;
}
