import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

export class CreateAppointmentPayloadDto {
  @IsOptional()
  @IsString({ message: 'La cédula debe ser una cadena de texto' })
  cedula?: string;

  @IsOptional()
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  nombre?: string;

  @IsOptional()
  @IsString({ message: 'Los apellidos deben ser una cadena de texto' })
  apellidos?: string;

  @IsOptional()
  @IsEmail({}, { message: 'El formato de correo no es válido' })
  correo?: string;

  @IsOptional()
  @IsString({ message: 'El celular debe ser una cadena de texto' })
  celular?: string;

  @IsBoolean()
  @IsOptional()
  recordatorioWhatsapp?: boolean;

  @IsOptional()
  @IsString()
  procedimientoId?: string;

  @IsOptional()
  @IsString()
  procedimientoNombre?: string;

  @IsOptional()
  @IsString()
  patientNationalId?: string;

  @IsOptional()
  @IsString()
  patientFullName?: string;

  @IsOptional()
  @IsEmail()
  patientEmail?: string;

  @IsOptional()
  @IsString()
  procedureId?: string;

  @IsOptional()
  @IsString()
  procedureName?: string;

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
