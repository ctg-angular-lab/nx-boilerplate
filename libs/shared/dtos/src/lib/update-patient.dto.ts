import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  IProcedureItem,
  IUpdatePatientRequest,
} from '@nx-boilerplate/api-interfaces';
import {
  PatientCompanionDto,
  PatientResponsibleDto,
} from './create-patient.dto';

export class UpdatePatientDto implements IUpdatePatientRequest {
  @IsOptional()
  @IsString({ message: 'El tipo de documento debe ser una cadena de texto' })
  tipo_documento?: string | null;

  @IsOptional()
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  nombre?: string;

  @IsOptional()
  @IsString({ message: 'Los apellidos deben ser una cadena de texto' })
  apellidos?: string;

  @IsOptional()
  @IsEmail({}, { message: 'El correo electrónico debe ser válido' })
  correo?: string;

  @IsOptional()
  @IsString({ message: 'El celular debe ser una cadena de texto' })
  celular?: string;

  @IsOptional()
  @IsString({ message: 'La fecha de nacimiento debe ser una cadena de texto' })
  fecha_nacimiento?: string | null;

  @IsOptional()
  @IsInt({ message: 'La edad debe ser un número entero' })
  @Min(0, { message: 'La edad no puede ser negativa' })
  edad?: number | null;

  @IsOptional()
  @IsString({ message: 'El sexo debe ser una cadena de texto' })
  sexo?: string | null;

  @IsOptional()
  @IsString({ message: 'El estado civil debe ser una cadena de texto' })
  estado_civil?: string | null;

  @IsOptional()
  @IsString({ message: 'La ocupación debe ser una cadena de texto' })
  ocupacion?: string | null;

  @IsOptional()
  @IsString({ message: 'La dirección de residencia debe ser una cadena de texto' })
  direccion_residencia?: string | null;

  @IsOptional()
  @IsString({ message: 'La aseguradora debe ser una cadena de texto' })
  aseguradora?: string | null;

  @IsOptional()
  @IsString({ message: 'El tipo de vinculación debe ser una cadena de texto' })
  tipo_vinculacion?: string | null;

  @IsOptional()
  @IsBoolean({ message: 'El indicador de menor de edad debe ser booleano' })
  es_menor_de_edad?: boolean | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => PatientCompanionDto)
  acompanante?: PatientCompanionDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => PatientResponsibleDto)
  persona_responsable?: PatientResponsibleDto;

  @IsOptional()
  @IsArray({ message: 'Los últimos procedimientos deben ser una lista' })
  ultimosProcedimientos?: IProcedureItem[];

  @IsOptional()
  @IsString({ message: 'Las recomendaciones deben ser una cadena de texto' })
  recomendaciones?: string;
}

export class UpdatePatientMessageDto {
  @IsString({ message: 'El documento de identidad debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El documento de identidad es obligatorio' })
  nationalId!: string;

  @IsObject({ message: 'Los datos de actualización deben ser un objeto' })
  @ValidateNested()
  @Type(() => UpdatePatientDto)
  @IsNotEmpty({ message: 'Los datos de actualización son requeridos' })
  data!: UpdatePatientDto;
}

