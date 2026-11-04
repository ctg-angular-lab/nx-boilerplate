import {
  ClinicalRecordStatus,
  ICitaMedica,
  IPatientHistory,
} from '@nx-boilerplate/api-interfaces';

/**
 * Pestañas principales del MFE Historial Pacientes
 */
export const HISTORIAL_TABS = {
  DIRECTORY: 1,
  EXPEDIENTE: 2,
} as const;

export type HistorialTabId = (typeof HISTORIAL_TABS)[keyof typeof HISTORIAL_TABS];

/**
 * Catálogos homologados con la base de datos real (json-pacientes.json) y Resolución 1995
 */
export const TIPOS_DOCUMENTO = ['CC', 'TI', 'CE', 'PA', 'RC'] as const;
export type TipoDocumento = (typeof TIPOS_DOCUMENTO)[number];

export const SEXOS_PACIENTE = ['Femenino', 'Masculino', 'Otro'] as const;
export type SexoPaciente = (typeof SEXOS_PACIENTE)[number];

export const ESTADOS_CIVILES = [
  'Soltero(a)',
  'Casado(a)',
  'Unión Libre',
  'Divorciado(a)',
  'Viudo(a)',
] as const;
export type EstadoCivil = (typeof ESTADOS_CIVILES)[number];

export const TIPOS_VINCULACION = [
  'Cotizante',
  'Beneficiario',
  'Contributivo',
  'Subsidiado',
  'Particular',
  'Prepagada',
] as const;
export type TipoVinculacion = (typeof TIPOS_VINCULACION)[number];

/**
 * Fila aplanada para la tabla del Directorio de Pacientes (Tab 1).
 * Permite que lib-data-table busque por nombre completo y ordene por columnas de primer nivel.
 */
export interface IPatientDirectoryRow extends Record<string, unknown> {
  cedula: string;
  tipo_documento: string;
  nombre: string;
  apellidos: string;
  nombreCompleto: string;
  correo: string;
  celular: string;
  edad: number | null;
  estadoFicha: 'COMPLETA' | 'INCOMPLETA';
  estadoFichaLabel: string;
  raw: IPatientHistory;
}

/**
 * Fila aplanada para la tabla de Historial de Citas / Atenciones Clínicas (Tab 2).
 * Expone identificadores y propiedades de primer nivel con rowKey="id" sin tocar lib-data-table.
 */
export interface IClinicalRecordRow extends Record<string, unknown> {
  id: string; // _id de MongoDB o appointmentId
  appointmentIdDisplay: string;
  fechaAtencion: string;
  procedimientoRealizado: string;
  medicoCedula: string;
  medicoNombre: string;
  estadoRegistro: ClinicalRecordStatus;
  estadoRegistroLabel: string;
  raw: ICitaMedica;
}

/**
 * Evalúa si la ficha demográfica de 20 campos de un paciente está completa según la Resolución 1995 de 1999.
 */
export function isDemographicComplete(patient: IPatientHistory | null | undefined): boolean {
  if (!patient) return false;

  const basicFilled =
    Boolean(patient.cedula?.trim()) &&
    Boolean(patient.nombre?.trim()) &&
    Boolean(patient.apellidos?.trim()) &&
    Boolean(patient.correo?.trim()) &&
    Boolean(patient.celular?.trim());

  const demographicFilled =
    Boolean(patient.fecha_nacimiento) &&
    Boolean(patient.sexo) &&
    Boolean(patient.direccion_residencia?.trim()) &&
    Boolean(patient.aseguradora?.trim());

  if (!basicFilled || !demographicFilled) {
    return false;
  }

  // Si es menor de edad, la persona responsable es obligatoria por ley
  if (patient.es_menor_de_edad) {
    const resp = patient.persona_responsable;
    return Boolean(resp?.nombre?.trim() && resp?.telefono?.trim());
  }

  return true;
}

/**
 * Normaliza los datos demográficos históricos del paciente (ej. 'Soltera' -> 'Soltero(a)', 'F' -> 'Femenino')
 * para que coincidan con las opciones exactas de los mat-select en el formulario.
 */
export function normalizePatientForForm(patient: IPatientHistory | null | undefined): {
  tipo_documento: string;
  cedula: string;
  nombre: string;
  apellidos: string;
  correo: string;
  celular: string;
  fecha_nacimiento: string;
  edad: number | null;
  sexo: string;
  estado_civil: string;
  ocupacion: string;
  direccion_residencia: string;
  aseguradora: string;
  tipo_vinculacion: string;
  es_menor_de_edad: boolean;
  acompanante: { nombre: string; telefono: string };
  persona_responsable: { nombre: string; telefono: string; parentesco: string };
} {
  if (!patient) {
    return {
      tipo_documento: 'CC',
      cedula: '',
      nombre: '',
      apellidos: '',
      correo: '',
      celular: '',
      fecha_nacimiento: '',
      edad: null,
      sexo: '',
      estado_civil: '',
      ocupacion: '',
      direccion_residencia: '',
      aseguradora: '',
      tipo_vinculacion: '',
      es_menor_de_edad: false,
      acompanante: { nombre: '', telefono: '' },
      persona_responsable: { nombre: '', telefono: '', parentesco: '' },
    };
  }

  // Normalización de Sexo
  let normalizedSexo = patient.sexo || '';
  if (normalizedSexo === 'F' || normalizedSexo.toLowerCase().startsWith('fem')) {
    normalizedSexo = 'Femenino';
  } else if (normalizedSexo === 'M' || normalizedSexo.toLowerCase().startsWith('mas')) {
    normalizedSexo = 'Masculino';
  }

  // Normalización de Estado Civil
  let normalizedEstadoCivil = patient.estado_civil || '';
  const ecLower = normalizedEstadoCivil.toLowerCase();
  if (ecLower.includes('solter')) {
    normalizedEstadoCivil = 'Soltero(a)';
  } else if (ecLower.includes('casad')) {
    normalizedEstadoCivil = 'Casado(a)';
  } else if (ecLower.includes('uni') || ecLower.includes('unión')) {
    normalizedEstadoCivil = 'Unión Libre';
  } else if (ecLower.includes('divorc')) {
    normalizedEstadoCivil = 'Divorciado(a)';
  } else if (ecLower.includes('viud')) {
    normalizedEstadoCivil = 'Viudo(a)';
  }

  // Normalización de Tipo de Vinculación
  let normalizedVinculacion = patient.tipo_vinculacion || '';
  const vincLower = normalizedVinculacion.toLowerCase();
  if (vincLower.includes('cotiz')) {
    normalizedVinculacion = 'Cotizante';
  } else if (vincLower.includes('benef')) {
    normalizedVinculacion = 'Beneficiario';
  } else if (vincLower.includes('contrib')) {
    normalizedVinculacion = 'Contributivo';
  } else if (vincLower.includes('subsid')) {
    normalizedVinculacion = 'Subsidiado';
  } else if (vincLower.includes('partic')) {
    normalizedVinculacion = 'Particular';
  } else if (vincLower.includes('prepag')) {
    normalizedVinculacion = 'Prepagada';
  }

  return {
    tipo_documento: patient.tipo_documento || 'CC',
    cedula: patient.cedula || '',
    nombre: patient.nombre || '',
    apellidos: patient.apellidos || '',
    correo: patient.correo || '',
    celular: patient.celular || '',
    fecha_nacimiento: patient.fecha_nacimiento || '',
    edad: patient.edad ?? null,
    sexo: normalizedSexo,
    estado_civil: normalizedEstadoCivil,
    ocupacion: patient.ocupacion || '',
    direccion_residencia: patient.direccion_residencia || '',
    aseguradora: patient.aseguradora || '',
    tipo_vinculacion: normalizedVinculacion,
    es_menor_de_edad: Boolean(patient.es_menor_de_edad),
    acompanante: {
      nombre: patient.acompanante?.nombre || '',
      telefono: patient.acompanante?.telefono || '',
    },
    persona_responsable: {
      nombre: patient.persona_responsable?.nombre || '',
      telefono: patient.persona_responsable?.telefono || '',
      parentesco: patient.persona_responsable?.parentesco || '',
    },
  };
}
