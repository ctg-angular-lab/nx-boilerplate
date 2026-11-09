/**
 * Interfaces TypeScript para el Contrato de Citas Médicas / Atenciones
 * Basado en los requerimientos de la Resolución 1995 de 1999 (Ministerio de Salud de Colombia)
 */

/**
 * Trazabilidad e identificación del profesional tratante (Art. 5 y Art. 18) [5, 6].
 * Reemplaza el sello/firma física por código o identificación unívoca y fecha/hora exacta [5].
 */
export interface IMedicoTratante {
  cedula_profesional: string;
  fecha_atencion: string | Date;
}

/**
 * Antecedentes relevantes para procedimientos estéticos no invasivos
 */
export interface IAntecedentesMedicos {
  patologicos: string;
  alergicos: string;
  farmacologicos: string;
  procedimientos_previos: string;
}

/**
 * Registro específico del acto médico asistencial (Art. 10) [3].
 * Contiene el detalle del procedimiento realizado y la trazabilidad del insumo [1, 3].
 */
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

/**
 * Anexos que sirven como sustento legal y técnico de la atención (Art. 11) [4].
 */
export interface ISoporteDocumental {
  consentimiento_informado: boolean;
  descargable_consentimiento: string;
}

/**
 * Contrato principal de la Cita Médica / Atención Clínica.
 * Relaciona al paciente mediante la cédula (Art. 6) sin duplicar su información demográfica [7].
 */
export interface ICitaMedica {
  _id?: string;
  cedula_paciente: string;
  medico_tratante: IMedicoTratante[];
  registro_clinico: IRegistroClinico;
  soporte_documental: ISoporteDocumental;
  createdAt: { $date: string } | string | Date;
  updatedAt: { $date: string } | string | Date;
  __v?: number;
}