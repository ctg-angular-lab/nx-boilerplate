import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';
import { ICreatePatientRequest, IProcedureItem } from '@nx-boilerplate/api-interfaces';

export class CreatePatientDto implements ICreatePatientRequest {
  @IsString({ message: 'La cédula debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La cédula es obligatoria' })
  @Length(5, 20, { message: 'La cédula debe tener entre 5 y 20 caracteres' })
  @Matches(/^[a-zA-Z0-9]+$/, {
    message: 'La cédula solo admite caracteres alfanuméricos',
  })
  cedula!: string;

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
  @IsArray({ message: 'Los últimos procedimientos deben ser una lista' })
  ultimosProcedimientos?: IProcedureItem[];

  @IsOptional()
  @IsString({ message: 'Las recomendaciones deben ser una cadena de texto' })
  recomendaciones?: string;
}

