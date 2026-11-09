/**
 * Interfaces TypeScript para el Contrato de Citas Médicas / Atenciones Clínicas
 * Basado en los requerimientos de la Resolución 1995 de 1999 (Ministerio de Salud de Colombia)
 */

export type ClinicalRecordStatus = 'PENDIENTE_ATENCION' | 'COMPLETADA';

export interface IMedicoTratante {
  cedula_profesional: string;
  nombre_profesional?: string;
  fecha_atencion: string | Date;
}

export interface IAntecedentesMedicos {
  patologicos: string;
  alergicos: string;
  farmacologicos: string;
  procedimientos_previos: string;
}

export interface IRegistroClinico {
  motivo_consulta: string;
  enfermedad_actual: string;
  antecedentes_medicos: IAntecedentesMedicos;
  examen_fisico: string;
  ultimosProcedimientos?: string[];
  procedimiento_realizado: string;
  lote_producto: string | null;
  recomendaciones: string;
}

export interface ISoporteDocumental {
  consentimiento_informado: boolean;
  descargable_consentimiento: string;
}

export interface ICitaMedica {
  _id?: string;
  appointmentId?: string | null;
  cedula_paciente: string;
  estado_registro: ClinicalRecordStatus;
  medico_tratante: IMedicoTratante[];
  registro_clinico: IRegistroClinico;
  soporte_documental: ISoporteDocumental;
  createdAt?: string | Date | { $date: string };
  updatedAt?: string | Date | { $date: string };
  __v?: number;
}

export type IClinicalRecord = ICitaMedica;

export interface IAppointmentConfirmedEvent {
  appointmentId: string;
  patientNationalId: string;
  doctorCedula: string;
  doctorEmail?: string;
  procedureId: string;
  procedureName: string;
  appointmentDate: string;
}

export interface ICreateClinicalRecordRequest {
  appointmentId?: string | null;
  cedula_paciente: string;
  estado_registro?: ClinicalRecordStatus;
  medico_tratante: IMedicoTratante[];
  registro_clinico: IRegistroClinico;
  soporte_documental?: ISoporteDocumental;
}

export interface IUpdateClinicalRecordRequest {
  estado_registro?: ClinicalRecordStatus;
  medico_tratante?: IMedicoTratante[];
  registro_clinico?: Partial<IRegistroClinico>;
  soporte_documental?: Partial<ISoporteDocumental>;
}

export interface IFindClinicalRecordByIdRequest {
  id: string;
}

