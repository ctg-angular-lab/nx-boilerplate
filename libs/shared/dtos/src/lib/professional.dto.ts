import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';
import { Exclude, Expose, Transform, Type } from 'class-transformer';
import {
  ExceptionScheduleType,
  IActiveProfessional,
  IExceptionSchedule,
  IWorkSchedule,
} from '@nx-boilerplate/api-interfaces';

export class LunchBreakDto {
  @IsString({ message: 'La hora de inicio de almuerzo debe ser un texto' })
  @IsNotEmpty({ message: 'La hora de inicio de almuerzo es requerida' })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'El receso de almuerzo inicio debe tener formato HH:mm',
  })
  @Expose()
  inicio!: string;

  @IsString({ message: 'La hora de fin de almuerzo debe ser un texto' })
  @IsNotEmpty({ message: 'La hora de fin de almuerzo es requerida' })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'El receso de almuerzo fin debe tener formato HH:mm',
  })
  @Expose()
  fin!: string;
}

export class WorkScheduleDto implements IWorkSchedule {
  @IsArray({ message: 'Los días laborales deben ser un array de strings' })
  @IsString({ each: true, message: 'Cada día laboral debe ser un string' })
  @IsNotEmpty({ message: 'Los días laborales son obligatorios' })
  @Expose()
  diasLaborales!: string[];

  @IsString({ message: 'La hora de inicio debe ser un texto' })
  @IsNotEmpty({ message: 'La hora de inicio es obligatoria' })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'La hora de inicio laboral debe tener formato HH:mm',
  })
  @Expose()
  horaInicio!: string;

  @IsString({ message: 'La hora de fin debe ser un texto' })
  @IsNotEmpty({ message: 'La hora de fin es obligatoria' })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'La hora de fin laboral debe tener formato HH:mm',
  })
  @Expose()
  horaFin!: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => LunchBreakDto)
  @Expose()
  recesoAlmuerzo?: LunchBreakDto;
}

export class ExceptionScheduleDto implements IExceptionSchedule {
  @IsString({ message: 'La fecha debe ser un texto' })
  @IsNotEmpty({ message: 'La fecha es obligatoria' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'La fecha de excepción debe tener formato YYYY-MM-DD',
  })
  fecha!: string;

  @IsString({ message: 'La hora de inicio debe ser un texto' })
  @IsNotEmpty({ message: 'La hora de inicio es obligatoria' })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'La hora de inicio de excepción debe tener formato HH:mm',
  })
  horaInicio!: string;

  @IsString({ message: 'La hora de fin debe ser un texto' })
  @IsNotEmpty({ message: 'La hora de fin es obligatoria' })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'La hora de fin de excepción debe tener formato HH:mm',
  })
  horaFin!: string;

  @IsIn(['EXTRA_SHIFT', 'DAY_OFF'], {
    message: "El tipo de excepción debe ser 'EXTRA_SHIFT' o 'DAY_OFF'",
  })
  @IsNotEmpty({ message: 'El tipo de excepción es obligatorio' })
  tipo!: ExceptionScheduleType;
}

export class CreateProfessionalDto
  implements Omit<IActiveProfessional, 'isActive' | 'horariosExcepcionales'>
{
  @IsString({ message: 'La cédula debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La cédula es requerida' })
  cedula!: string;

  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre es requerido' })
  nombres!: string;

  @IsString({ message: 'Los apellidos deben ser una cadena de texto' })
  @IsNotEmpty({ message: 'Los apellidos son requeridos' })
  apellidos!: string;

  @IsEmail({}, { message: 'El correo electrónico debe tener un formato válido' })
  @IsNotEmpty({ message: 'El correo electrónico es requerido' })
  email!: string;

  @IsString({ message: 'La profesión debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La profesión es requerida' })
  profesion!: string;

  @IsOptional()
  @IsArray({ message: 'Los procedimientos relacionados deben ser un array de strings' })
  @IsString({ each: true, message: 'Cada procedimiento debe ser un string' })
  procedimientosRelacionados?: string[];

  @IsObject({ message: 'El horario de trabajo debe ser un objeto' })
  @ValidateNested()
  @Type(() => WorkScheduleDto)
  @IsNotEmpty({ message: 'El horario de trabajo es obligatorio' })
  horarioTrabajo!: WorkScheduleDto;
}

export class UpdateProfessionalDto {
  @IsOptional()
  @IsString({ message: 'La cédula debe ser un string' })
  cedula?: string;

  @IsOptional()
  @IsString({ message: 'Los nombres deben ser un string' })
  nombres?: string;

  @IsOptional()
  @IsString({ message: 'Los apellidos deben ser un string' })
  apellidos?: string;

  @IsOptional()
  @IsEmail({}, { message: 'El correo debe ser válido' })
  email?: string;

  @IsOptional()
  @IsString({ message: 'La profesión debe ser un string' })
  profesion?: string;

  @IsOptional()
  @IsArray({ message: 'Los procedimientos deben ser un array' })
  @IsString({ each: true, message: 'Cada procedimiento debe ser un string' })
  procedimientosRelacionados?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => WorkScheduleDto)
  horarioTrabajo?: WorkScheduleDto;

  @IsOptional()
  @IsBoolean({ message: 'isActive debe ser un booleano' })
  isActive?: boolean;
}

export class UpdateScheduleExceptionsDto {
  @IsOptional()
  @IsArray({ message: 'Las excepciones deben ser una lista' })
  @ValidateNested({ each: true })
  @Type(() => ExceptionScheduleDto)
  horariosExcepcionales?: ExceptionScheduleDto[];

  @IsOptional()
  @IsArray({ message: 'Las excepciones deben ser una lista' })
  @ValidateNested({ each: true })
  @Type(() => ExceptionScheduleDto)
  exceptions?: ExceptionScheduleDto[];
}

/**
 * DTO para endpoint público (GET /api/doctors).
 * Aplica Default Deny (@Exclude) exponiendo únicamente los datos requeridos por el paciente.
 */
@Exclude()
export class PublicProfessionalDto {
  @Expose()
  cedula!: string;

  @Expose()
  nombres!: string;

  @Expose()
  apellidos!: string;

  @Expose()
  profesion!: string;

  @Expose()
  procedimientosRelacionados?: string[];

  @Expose()
  @Type(() => WorkScheduleDto)
  horarioTrabajo!: WorkScheduleDto;
}

export class DoctorCedulaPayloadDto {
  @IsString({ message: 'La cédula debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La cédula es obligatoria' })
  cedula!: string;
}

export class UpdateDoctorMessageDto {
  @IsString({ message: 'La cédula debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La cédula es obligatoria' })
  cedula!: string;

  @IsObject({ message: 'Los datos de actualización deben ser un objeto' })
  @ValidateNested()
  @Type(() => UpdateProfessionalDto)
  @IsNotEmpty({ message: 'Los datos a actualizar son obligatorios' })
  data!: UpdateProfessionalDto;
}

export class UpdateDoctorScheduleMessageDto {
  @IsString({ message: 'La cédula debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La cédula es obligatoria' })
  cedula!: string;

  @IsArray({ message: 'Las excepciones deben ser una lista' })
  @ValidateNested({ each: true })
  @Type(() => ExceptionScheduleDto)
  exceptions!: ExceptionScheduleDto[];
}

export class GetDoctorsFilterDto {
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({ message: 'includeInactive debe ser booleano' })
  includeInactive?: boolean;
}

export class GetDoctorsMessageDto {
  @IsOptional()
  @IsBoolean({ message: 'includeInactive debe ser booleano' })
  includeInactive?: boolean;
}

