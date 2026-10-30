export interface IFindPatientByNationalIdRequest {
  nationalId: string;
}

export interface IProcedureItem {
  id: string;
  nombre: string;
  fecha: string;
  profesional: string;
}

export interface IPatientCompanion {
  nombre: string | null;
  telefono: string | null;
}

export interface IPatientResponsible {
  nombre: string | null;
  telefono: string | null;
  parentesco: string | null;
}

export interface IPatientHistory {
  _id?: string;
  cedula: string;
  tipo_documento?: string | null;
  nombre: string;
  apellidos: string;
  correo: string;
  celular: string;
  fecha_nacimiento?: string | null;
  edad?: number | null;
  sexo?: string | null;
  estado_civil?: string | null;
  ocupacion?: string | null;
  direccion_residencia?: string | null;
  aseguradora?: string | null;
  tipo_vinculacion?: string | null;
  es_menor_de_edad?: boolean | null;
  acompanante?: IPatientCompanion;
  persona_responsable?: IPatientResponsible;
  ultimosProcedimientos?: IProcedureItem[];
  recomendaciones?: string;
  createdAt?: string | Date | { $date: string };
  updatedAt?: string | Date | { $date: string };
}

export type IPatient = IPatientHistory;

export interface ICreatePatientRequest {
  cedula: string;
  tipo_documento?: string | null;
  nombre: string;
  apellidos: string;
  correo: string;
  celular: string;
  fecha_nacimiento?: string | null;
  edad?: number | null;
  sexo?: string | null;
  estado_civil?: string | null;
  ocupacion?: string | null;
  direccion_residencia?: string | null;
  aseguradora?: string | null;
  tipo_vinculacion?: string | null;
  es_menor_de_edad?: boolean | null;
  acompanante?: IPatientCompanion;
  persona_responsable?: IPatientResponsible;
  ultimosProcedimientos?: IProcedureItem[];
  recomendaciones?: string;
}

export type { IAreaCode } from './area-code.interface';
