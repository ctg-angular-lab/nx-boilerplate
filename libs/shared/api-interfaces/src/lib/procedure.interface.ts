export interface IProcedure {
  idProcedimiento: string;
  nombreProcedimiento: string;
  valorStandar: number;
  duracionStandar: number;
  medicosRelacionados: string[];
}

export interface IFindProcedureByIdRequest {
  idProcedimiento: string;
}

export interface IFindProceduresByDoctorRequest {
  doctorCedula: string;
}
