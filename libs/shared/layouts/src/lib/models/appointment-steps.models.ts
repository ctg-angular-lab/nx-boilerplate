import {
  IPatientHistory,
  IProcedureItem,
} from '@nx-boilerplate/api-interfaces';

export type ProcedureItem = IProcedureItem;
export type PatientHistory = IPatientHistory;

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
