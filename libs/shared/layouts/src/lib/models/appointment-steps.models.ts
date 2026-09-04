export interface ProcedureItem {
  id: string;
  nombre: string;
  fecha: string;
  profesional: string;
}

export interface PatientHistory {
  cedula: string;
  nombreCompleto: string;
  ultimosProcedimientos: ProcedureItem[];
  recomendaciones: string;
}

export interface AvailableDate {
  id: string;
  fecha: string;
  hora: string;
  profesional?: string;
  disponible: boolean;
}

export interface MedicalProcedureOption {
  id: string;
  nombre: string;
  duracion: string;
  especialidad: string;
}
