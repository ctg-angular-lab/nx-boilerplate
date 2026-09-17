import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import {
  ICreateAppointmentRequest,
  ICreateWaitlistRequest,
} from '@nx-boilerplate/api-interfaces';

export class CreateAppointmentDto implements ICreateAppointmentRequest {
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

  @IsBoolean({ message: 'El recordatorio de WhatsApp debe ser un booleano' })
  @IsOptional()
  recordatorioWhatsapp = false;

  @IsString({ message: 'El ID del procedimiento debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El ID del procedimiento es requerido' })
  procedimientoId!: string;

  @IsString({ message: 'El ID del slot debe ser una cadena de texto' })
  @IsOptional()
  slotId?: string;

  @IsString({ message: 'La fecha debe ser una cadena de texto' })
  @IsOptional()
  fecha?: string;

  @IsString({ message: 'La hora debe ser una cadena de texto' })
  @IsOptional()
  hora?: string;
}

export class CreateWaitlistDto implements ICreateWaitlistRequest {
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

  @IsString({ message: 'El ID del procedimiento debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El ID del procedimiento es requerido' })
  procedimientoId!: string;
}

export class GetAvailableDatesQueryDto {
  @IsString()
  @IsOptional()
  procedureId?: string;
}
