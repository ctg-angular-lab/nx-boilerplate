export type ExceptionScheduleType = 'EXTRA_SHIFT' | 'DAY_OFF';

export interface IExceptionSchedule {
  fecha: string; // YYYY-MM-DD
  horaInicio: string; // HH:mm
  horaFin: string; // HH:mm
  tipo: ExceptionScheduleType;
}

export interface IWorkSchedule {
  diasLaborales: string[];
  horaInicio: string;
  horaFin: string;
  recesoAlmuerzo?: {
    inicio: string;
    fin: string;
  } | null;
}

export interface IActiveProfessional {
  cedula: string;
  nombres: string;
  apellidos: string;
  email: string;
  profesion: string;
  procedimientosRelacionados?: string[];
  horarioTrabajo: IWorkSchedule;
  isActive?: boolean;
  horariosExcepcionales?: IExceptionSchedule[];
}

/** Payload de alta (POST /api/doctors). El backend fija isActive y horariosExcepcionales. */
export type ICreateProfessionalRequest = Omit<
  IActiveProfessional,
  'isActive' | 'horariosExcepcionales'
>;

/** Payload de actualización parcial (PATCH /api/doctors/:cedula). La cédula es inmutable (viaja en la URL). */
export type IUpdateProfessionalRequest = Partial<
  Omit<ICreateProfessionalRequest, 'cedula'>
> & {
  isActive?: boolean;
};

export interface IGetDoctorsQueryRequest {
  includeInactive?: boolean;
}


export type IProfessionalSummary = Pick<
  IActiveProfessional,
  'cedula' | 'nombres' | 'apellidos' | 'email' | 'profesion' | 'horarioTrabajo'
>;

export interface IProcedureLaboratory {
  nombreLaboratorio: string;
  precio: number;
  medidaPorUnidad: string;
}

export interface IProcedure {
  idProcedimiento: string;
  nombreProcedimiento: string;
  valorStandar: number;
  duracionStandar: number;
  medicosRelacionados: string[];
  isActive?: boolean;
  laboratorios?: IProcedureLaboratory[];
}

/** POST /api/procedures. El backend fija id, isActive y medicosRelacionados. */
export type ICreateProcedureRequest = Omit<
  IProcedure,
  'idProcedimiento' | 'isActive' | 'medicosRelacionados'
>;

/** PATCH /api/procedures/:idProcedimiento. medicosRelacionados no es editable aquí. */
export type IUpdateProcedureRequest = Partial<ICreateProcedureRequest> & {
  isActive?: boolean;
};

export interface IGetProceduresQueryRequest {
  doctorCedula?: string;
  includeInactive?: boolean;
}

export interface IProcedureSoftDeleteResponse {
  success: boolean;
  message: string;
  idProcedimiento: string;
  isActive: boolean;
}

export interface IFindProcedureByIdRequest {
  idProcedimiento: string;
}

export interface IFindProceduresByDoctorRequest {
  doctorCedula: string;
}


