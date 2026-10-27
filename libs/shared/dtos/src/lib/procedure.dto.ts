import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import {
  ICreateProcedureRequest,
  IFindProcedureByIdRequest,
  IFindProceduresByDoctorRequest,
  IGetProceduresQueryRequest,
  IProcedureLaboratory,
  IUpdateProcedureRequest,
} from '@nx-boilerplate/api-interfaces';

export class ProcedureLaboratoryDto implements IProcedureLaboratory {
  @IsString({ message: 'El nombre del laboratorio debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre del laboratorio es obligatorio' })
  @MinLength(2, { message: 'El nombre del laboratorio debe tener al menos 2 caracteres' })
  nombreLaboratorio!: string;

  @IsNumber({}, { message: 'El precio del laboratorio debe ser un número' })
  @Min(0, { message: 'El precio del laboratorio debe ser mayor o igual a 0' })
  precio!: number;

  @IsString({ message: 'La medida por unidad debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La medida por unidad es obligatoria' })
  medidaPorUnidad!: string;
}

export class CreateProcedureDto implements ICreateProcedureRequest {
  @IsString({ message: 'El nombre del procedimiento debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre del procedimiento es obligatorio' })
  @MinLength(3, { message: 'El nombre del procedimiento debe tener al menos 3 caracteres' })
  @MaxLength(100, { message: 'El nombre del procedimiento no debe superar los 100 caracteres' })
  nombreProcedimiento!: string;

  @IsNumber({}, { message: 'El valor estándar debe ser un número' })
  @Min(0, { message: 'El valor estándar debe ser mayor o igual a 0' })
  valorStandar!: number;

  @IsNumber({}, { message: 'La duración estándar debe ser un número en minutos' })
  @Min(5, { message: 'La duración estándar mínima es de 5 minutos' })
  @Max(480, { message: 'La duración estándar máxima es de 480 minutos (8 horas)' })
  duracionStandar!: number;

  @IsOptional()
  @IsArray({ message: 'Los laboratorios deben ser una lista' })
  @ValidateNested({ each: true })
  @Type(() => ProcedureLaboratoryDto)
  laboratorios?: ProcedureLaboratoryDto[];
}

export class UpdateProcedureDto implements IUpdateProcedureRequest {
  @IsOptional()
  @IsString({ message: 'El nombre del procedimiento debe ser una cadena de texto' })
  @MinLength(3, { message: 'El nombre del procedimiento debe tener al menos 3 caracteres' })
  @MaxLength(100, { message: 'El nombre del procedimiento no debe superar los 100 caracteres' })
  nombreProcedimiento?: string;

  @IsOptional()
  @IsNumber({}, { message: 'El valor estándar debe ser un número' })
  @Min(0, { message: 'El valor estándar debe ser mayor o igual a 0' })
  valorStandar?: number;

  @IsOptional()
  @IsNumber({}, { message: 'La duración estándar debe ser un número en minutos' })
  @Min(5, { message: 'La duración estándar mínima es de 5 minutos' })
  @Max(480, { message: 'La duración estándar máxima es de 480 minutos' })
  duracionStandar?: number;

  @IsOptional()
  @IsArray({ message: 'Los laboratorios deben ser una lista' })
  @ValidateNested({ each: true })
  @Type(() => ProcedureLaboratoryDto)
  laboratorios?: ProcedureLaboratoryDto[];

  @IsOptional()
  @IsBoolean({ message: 'isActive debe ser un booleano' })
  isActive?: boolean;
}

export class UpdateProcedureMessageDto {
  @IsString({ message: 'El id del procedimiento debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El id del procedimiento es obligatorio' })
  idProcedimiento!: string;

  @IsObject({ message: 'Los datos a actualizar deben ser un objeto' })
  @ValidateNested()
  @Type(() => UpdateProcedureDto)
  @IsNotEmpty({ message: 'Los datos a actualizar son obligatorios' })
  data!: UpdateProcedureDto;
}

export class GetProceduresMessageDto {
  @IsOptional()
  @IsBoolean({ message: 'includeInactive debe ser un booleano' })
  includeInactive?: boolean;
}

export class FilterProceduresQueryDto implements IGetProceduresQueryRequest {
  @IsOptional()
  @IsString({ message: 'La cédula del médico debe ser una cadena de texto' })
  doctorCedula?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({ message: 'includeInactive debe ser un booleano' })
  includeInactive?: boolean;
}

export class FindProcedureByIdDto implements IFindProcedureByIdRequest {
  @IsString({ message: 'El id del procedimiento debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El id del procedimiento es obligatorio' })
  idProcedimiento!: string;
}

export class FindProcedureParamDto implements IFindProcedureByIdRequest {
  @IsString({ message: 'El identificador del procedimiento debe ser un string' })
  @IsNotEmpty({ message: 'El identificador del procedimiento es requerido' })
  idProcedimiento!: string;
}

export class FindProceduresByDoctorDto implements IFindProceduresByDoctorRequest {
  @IsString({ message: 'La cédula del médico debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La cédula del médico es obligatoria' })
  doctorCedula!: string;
}
