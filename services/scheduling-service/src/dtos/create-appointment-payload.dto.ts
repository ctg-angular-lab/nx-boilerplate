import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

export class CreateAppointmentPayloadDto {
  @IsString({ message: 'La cédula debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La cédula es requerida' })
  @Matches(/^[0-9]+$/, { message: 'La cédula debe contener solo números' })
  cedula!: string;

  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre es requerido' })
  nombre!: string;

  @IsString({ message: 'Los apellidos deben ser una cadena de texto' })
  @IsNotEmpty({ message: 'Los apellidos son requeridos' })
  apellidos!: string;

  @IsEmail({}, { message: 'El formato de correo no es válido' })
  @IsNotEmpty({ message: 'El correo electrónico es requerido' })
  correo!: string;

  @IsString({ message: 'El celular debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El celular es requerido' })
  celular!: string;

  @IsBoolean()
  @IsOptional()
  recordatorioWhatsapp?: boolean;

  @IsString()
  @IsNotEmpty({ message: 'El ID del procedimiento es requerido' })
  procedimientoId!: string;

  @IsOptional()
  @IsString()
  procedimientoNombre?: string;

  @IsOptional()
  @IsEmail()
  doctorEmail?: string;

  @IsOptional()
  @IsString()
  doctorCedula?: string;

  @IsOptional()
  @IsString()
  fecha?: string; // Formato YYYY-MM-DD

  @IsOptional()
  @IsString()
  hora?: string; // Formato HH:mm

  @IsOptional()
  @IsString()
  startTime?: string; // ISO string alternativo

  @IsOptional()
  @IsString()
  endTime?: string; // ISO string alternativo

  @IsOptional()
  @IsString()
  notes?: string;
}
