import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  ICreatePatientRequest,
  IPatientCompanion,
  IPatientResponsible,
  IProcedureItem,
} from '@nx-boilerplate/api-interfaces';

export class PatientCompanionDto implements IPatientCompanion {
  @IsOptional()
  @IsString({ message: 'El nombre del acompañante debe ser una cadena de texto' })
  nombre: string | null = null;

  @IsOptional()
  @IsString({ message: 'El teléfono del acompañante debe ser una cadena de texto' })
  telefono: string | null = null;
}

export class PatientResponsibleDto implements IPatientResponsible {
  @IsOptional()
  @IsString({ message: 'El nombre del responsable debe ser una cadena de texto' })
  nombre: string | null = null;

  @IsOptional()
  @IsString({ message: 'El teléfono del responsable debe ser una cadena de texto' })
  telefono: string | null = null;

  @IsOptional()
  @IsString({ message: 'El parentesco del responsable debe ser una cadena de texto' })
  parentesco: string | null = null;
}

export class CreatePatientDto implements ICreatePatientRequest {
  @IsString({ message: 'La cédula debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La cédula es obligatoria' })
  @Length(5, 20, { message: 'La cédula debe tener entre 5 y 20 caracteres' })
  @Matches(/^[a-zA-Z0-9]+$/, {
    message: 'La cédula solo admite caracteres alfanuméricos',
  })
  cedula!: string;

  @IsOptional()
  @IsString({ message: 'El tipo de documento debe ser una cadena de texto' })
  tipo_documento?: string | null;

  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  nombre!: string;

  @IsString({ message: 'Los apellidos deben ser una cadena de texto' })
  @IsNotEmpty({ message: 'Los apellidos son obligatorios' })
  apellidos!: string;

  @IsEmail({}, { message: 'El correo electrónico debe ser válido' })
  @IsNotEmpty({ message: 'El correo electrónico es obligatorio' })
  correo!: string;

  @IsString({ message: 'El celular debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El celular es obligatorio' })
  celular!: string;

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
