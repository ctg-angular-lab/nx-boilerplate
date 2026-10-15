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
  };
}

export interface IActiveProfessional {
  cedula: string;
  nombres: string;
  apellidos: string;
  email: string;
  profesion: string;
  procedimientosRelacionados?: string[];
  horarioTrabajo: IWorkSchedule;
  isActive: boolean;
  horariosExcepcionales?: IExceptionSchedule[];
}

export type IProfessionalSummary = Pick<
  IActiveProfessional,
  'cedula' | 'nombres' | 'apellidos' | 'email' | 'profesion' | 'horarioTrabajo'
>;

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

