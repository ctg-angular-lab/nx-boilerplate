import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  ClinicalRecordStatus,
  IAntecedentesMedicos,
  IAppointmentConfirmedEvent,
  ICreateClinicalRecordRequest,
  IFindClinicalRecordByIdRequest,
  IMedicoTratante,
  IRegistroClinico,
  ISoporteDocumental,
  IUpdateClinicalRecordRequest,
} from '@nx-boilerplate/api-interfaces';

export class AppointmentConfirmedEventDto implements IAppointmentConfirmedEvent {
  @IsString({ message: 'El appointmentId debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El appointmentId es obligatorio' })
  appointmentId!: string;

  @IsString({ message: 'El patientNationalId debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El patientNationalId es obligatorio' })
  patientNationalId!: string;

  @IsString({ message: 'La cédula del doctor debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La cédula del doctor es obligatoria' })
  doctorCedula!: string;

  @IsOptional()
  @IsEmail({}, { message: 'El correo del doctor debe ser válido' })
  doctorEmail?: string;

  @IsString({ message: 'El procedureId debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El procedureId es obligatorio' })
  procedureId!: string;

  @IsString({ message: 'El nombre del procedimiento debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre del procedimiento es obligatorio' })
  procedureName!: string;

  @IsDateString({}, { message: 'La fecha de la cita debe ser un formato de fecha ISO válido' })
  @IsNotEmpty({ message: 'La fecha de la cita es obligatoria' })
  appointmentDate!: string;
}

export class MedicoTratanteDto implements IMedicoTratante {
  @IsString({ message: 'La cédula del profesional debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La cédula del profesional es obligatoria' })
  cedula_profesional!: string;

  @IsOptional()
  @IsString({ message: 'El nombre del profesional debe ser una cadena de texto' })
  nombre_profesional?: string;

  @IsNotEmpty({ message: 'La fecha de atención es obligatoria' })
  fecha_atencion!: string | Date;
}

export class AntecedentesMedicosDto implements IAntecedentesMedicos {
  @IsString({ message: 'Antecedentes patológicos debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'Antecedentes patológicos es obligatorio' })
  patologicos!: string;

  @IsString({ message: 'Antecedentes alérgicos debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'Antecedentes alérgicos es obligatorio' })
  alergicos!: string;

  @IsString({ message: 'Antecedentes farmacológicos debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'Antecedentes farmacológicos es obligatorio' })
  farmacologicos!: string;

  @IsString({ message: 'Procedimientos previos debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'Procedimientos previos es obligatorio' })
  procedimientos_previos!: string;
}

export class RegistroClinicoDto implements IRegistroClinico {
  @IsString({ message: 'El motivo de consulta debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El motivo de consulta es obligatorio' })
  motivo_consulta!: string;

  @IsString({ message: 'La enfermedad actual debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La enfermedad actual es obligatoria' })
  enfermedad_actual!: string;

  @IsObject({ message: 'Los antecedentes médicos deben ser un objeto' })
  @ValidateNested()
  @Type(() => AntecedentesMedicosDto)
  @IsNotEmpty({ message: 'Los antecedentes médicos son obligatorios' })
  antecedentes_medicos!: AntecedentesMedicosDto;

  @IsString({ message: 'El examen físico debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El examen físico es obligatorio' })
  examen_fisico!: string;

  @IsOptional()
  @IsArray({ message: 'Los últimos procedimientos deben ser una lista' })
  @IsString({ each: true, message: 'Cada procedimiento previo debe ser una cadena de texto' })
  ultimosProcedimientos?: string[];

  @IsString({ message: 'El procedimiento realizado debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El procedimiento realizado es obligatorio' })
  procedimiento_realizado!: string;

  @IsOptional()
  @IsString({ message: 'El lote del producto debe ser una cadena de texto' })
  lote_producto!: string | null;

  @IsString({ message: 'Las recomendaciones deben ser una cadena de texto' })
  @IsNotEmpty({ message: 'Las recomendaciones son obligatorias' })
  recomendaciones!: string;
}

export class SoporteDocumentalDto implements ISoporteDocumental {
  @IsBoolean({ message: 'El consentimiento informado debe ser booleano' })
  @IsNotEmpty({ message: 'El consentimiento informado es obligatorio' })
  consentimiento_informado!: boolean;

  @IsString({ message: 'El descargable de consentimiento debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El descargable de consentimiento es obligatorio' })
  descargable_consentimiento!: string;
}

export class CreateClinicalRecordDto implements ICreateClinicalRecordRequest {
  @IsOptional()
  @IsString({ message: 'El appointmentId debe ser una cadena de texto' })
  appointmentId?: string | null;

  @IsString({ message: 'La cédula del paciente debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La cédula del paciente es obligatoria' })
  cedula_paciente!: string;

  @IsOptional()
  @IsIn(['PENDIENTE_ATENCION', 'COMPLETADA'], {
    message: "El estado del registro debe ser 'PENDIENTE_ATENCION' o 'COMPLETADA'",
  })
  estado_registro?: ClinicalRecordStatus;

  @IsArray({ message: 'El médico tratante debe ser una lista' })
  @ValidateNested({ each: true })
  @Type(() => MedicoTratanteDto)
  @IsNotEmpty({ message: 'El médico tratante es obligatorio' })
  medico_tratante!: MedicoTratanteDto[];

  @IsObject({ message: 'El registro clínico debe ser un objeto' })
  @ValidateNested()
  @Type(() => RegistroClinicoDto)
  @IsNotEmpty({ message: 'El registro clínico es obligatorio' })
  registro_clinico!: RegistroClinicoDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => SoporteDocumentalDto)
  soporte_documental?: SoporteDocumentalDto;
}

export class UpdateClinicalRecordDto implements IUpdateClinicalRecordRequest {
  @IsOptional()
  @IsIn(['PENDIENTE_ATENCION', 'COMPLETADA'], {
    message: "El estado del registro debe ser 'PENDIENTE_ATENCION' o 'COMPLETADA'",
  })
  estado_registro?: ClinicalRecordStatus;

  @IsOptional()
  @IsArray({ message: 'El médico tratante debe ser una lista' })
  @ValidateNested({ each: true })
  @Type(() => MedicoTratanteDto)
  medico_tratante?: MedicoTratanteDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => RegistroClinicoDto)
  registro_clinico?: Partial<RegistroClinicoDto>;

  @IsOptional()
  @ValidateNested()
  @Type(() => SoporteDocumentalDto)
  soporte_documental?: Partial<SoporteDocumentalDto>;
}

export class UpdateClinicalRecordMessageDto {
  @IsString({ message: 'El id de la atención debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El id de la atención es obligatorio' })
  id!: string;

  @IsObject({ message: 'Los datos de actualización deben ser un objeto' })
  @ValidateNested()
  @Type(() => UpdateClinicalRecordDto)
  @IsNotEmpty({ message: 'Los datos de actualización son obligatorios' })
  data!: UpdateClinicalRecordDto;
}

export class FindClinicalRecordByIdDto implements IFindClinicalRecordByIdRequest {
  @IsString({ message: 'El id debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El id es obligatorio' })
  id!: string;
}

