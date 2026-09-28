export interface IFindPatientByNationalIdRequest {
  nationalId: string;
}

export interface IProcedureItem {
  id: string;
  nombre: string;
  fecha: string;
  profesional: string;
}

export interface IPatientHistory {
  cedula: string;
  nombre: string;
  apellidos: string;
  correo: string;
  celular: string;
  ultimosProcedimientos: IProcedureItem[];
  recomendaciones: string;
}
