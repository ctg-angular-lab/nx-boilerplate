export interface ISlotDisplay {
  startTime: string;
  endTime: string;
  display: string;
}

export interface IDayAvailability {
  date: string;
  dayName: string;
  slots: ISlotDisplay[];
  /**
   * true  → el calendario del doctor está sincronizado con el bot (datos de Google Calendar reales)
   * false → el bot no tiene acceso al calendario del doctor
   */
  isCalendarSynced: boolean;
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

export interface IBookingPatient {
  cedula: string;
  nombre: string;
  apellidos: string;
  correo: string;
  celular: string;
}

export interface ICreateAppointmentBody {
  doctorEmail: string;
  doctorCedula: string;
  patientNationalId: string;
  patientFullName: string;
  patientEmail: string;
  procedureId: string;
  procedureName: string;
  startTime: string;
  endTime: string;
  notes?: string;
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
  doctorCedula?: string;
  patientNationalId?: string;
  patientEmail?: string;
  procedureId?: string;
}

export interface ICreateWaitlistRequest {
  cedula: string;
  nombre: string;
  apellidos: string;
  correo: string;
  celular: string;
  procedimientoId: string;
}

export interface IWeekWindow {
  startDate: string;   // YYYY-MM-DD (nunca domingo)
  endDate: string;     // YYYY-MM-DD (siempre sábado de la semana calculada)
  totalDays: number;   // 1 a 6 días
  offsetWeeks: number; // 0 = semana actual, 1 = siguiente, -1 = anterior
}
