import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import {
  ICreateAppointmentBody,
  ICreateAppointmentRequest,
  ICreateWaitlistRequest,
  IGetAvailableDatesRequest,
  IGetDailyAppointmentsRequest,
  IUpdateAppointmentStatusRequest,
  ITrackContactRequest,
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

  @IsString({ message: 'El nombre del procedimiento debe ser una cadena de texto' })
  @IsOptional()
  procedimientoNombre?: string;

  @IsString({ message: 'El ID del slot debe ser una cadena de texto' })
  @IsOptional()
  slotId?: string;

  @IsString({ message: 'La fecha debe ser una cadena de texto' })
  @IsOptional()
  fecha?: string;

  @IsString({ message: 'La hora debe ser una cadena de texto' })
  @IsOptional()
  hora?: string;

  @IsString({ message: 'Las notas deben ser una cadena de texto' })
  @IsOptional()
  notes?: string;
}

export class CreateAppointmentBodyDto implements ICreateAppointmentBody {
  @IsEmail({}, { message: 'El correo del médico no es válido' })
  @IsNotEmpty({ message: 'El correo del médico es obligatorio' })
  doctorEmail!: string;

  @IsString({ message: 'La cédula del médico es obligatoria' })
  @IsNotEmpty({ message: 'La cédula del médico no puede estar vacía' })
  doctorCedula!: string;

  @IsString({ message: 'El documento del paciente es obligatorio' })
  @IsNotEmpty({ message: 'El documento del paciente no puede estar vacío' })
  patientNationalId!: string;

  @IsString({ message: 'El nombre completo del paciente es obligatorio' })
  @IsNotEmpty({ message: 'El nombre completo del paciente no puede estar vacío' })
  patientFullName!: string;

  @IsEmail({}, { message: 'El correo del paciente no es válido' })
  @IsNotEmpty({ message: 'El correo del paciente es obligatorio' })
  patientEmail!: string;

  @IsString({ message: 'El celular del paciente debe ser una cadena' })
  @IsOptional()
  patientPhone?: string;

  @IsString({ message: 'El ID del procedimiento es obligatorio' })
  @IsNotEmpty({ message: 'El ID del procedimiento no puede estar vacío' })
  procedureId!: string;

  @IsString({ message: 'El nombre del procedimiento es obligatorio' })
  @IsNotEmpty({ message: 'El nombre del procedimiento no puede estar vacío' })
  procedureName!: string;

  @IsISO8601({}, { message: 'startTime debe ser una fecha ISO 8601 válida' })
  @IsNotEmpty({ message: 'startTime es obligatorio' })
  startTime!: string;

  @IsISO8601({}, { message: 'endTime debe ser una fecha ISO 8601 válida' })
  @IsNotEmpty({ message: 'endTime es obligatorio' })
  endTime!: string;

  @IsString({ message: 'Las notas deben ser una cadena de texto' })
  @IsOptional()
  notes?: string;

  // Campos opcionales de compatibilidad para el payload
  @IsOptional()
  @IsString()
  cedula?: string;

  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  apellidos?: string;

  @IsOptional()
  @IsEmail()
  correo?: string;

  @IsOptional()
  @IsString()
  celular?: string;

  @IsOptional()
  @IsBoolean()
  recordatorioWhatsapp?: boolean;

  @IsOptional()
  @IsString()
  procedimientoId?: string;

  @IsOptional()
  @IsString()
  procedimientoNombre?: string;

  @IsOptional()
  @IsString()
  fecha?: string;

  @IsOptional()
  @IsString()
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

export class CreateWaitlistBodyDto {
  @IsString({ message: 'El documento del paciente es obligatorio' })
  @IsNotEmpty({ message: 'El documento del paciente no puede estar vacío' })
  patientNationalId!: string;

  @IsString({ message: 'El nombre completo del paciente es obligatorio' })
  @IsNotEmpty({ message: 'El nombre completo del paciente no puede estar vacío' })
  patientFullName!: string;

  @IsEmail({}, { message: 'El correo del paciente no es válido' })
  @IsNotEmpty({ message: 'El correo del paciente es obligatorio' })
  patientEmail!: string;

  @IsString({ message: 'El teléfono del paciente es obligatorio' })
  @IsNotEmpty({ message: 'El teléfono del paciente no puede estar vacío' })
  patientPhone!: string;

  @IsString({ message: 'El ID del procedimiento es obligatorio' })
  @IsNotEmpty({ message: 'El ID del procedimiento no puede estar vacío' })
  procedureId!: string;

  @IsEmail({}, { message: 'El correo del médico preferido no es válido' })
  @IsOptional()
  preferredDoctorEmail?: string;

  @IsOptional()
  @IsString()
  cedula?: string;

  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  apellidos?: string;

  @IsOptional()
  @IsEmail()
  correo?: string;

  @IsOptional()
  @IsString()
  celular?: string;

  @IsOptional()
  @IsString()
  procedimientoId?: string;
}

export class GetAvailableDatesQueryDto implements IGetAvailableDatesRequest {
  @IsString({ message: 'El ID del procedimiento debe ser una cadena' })
  @IsOptional()
  procedureId?: string;

  @IsEmail({}, { message: 'El formato de correo del médico no es válido' })
  @IsOptional()
  doctorEmail?: string;

  @IsString({ message: 'La cédula del médico debe ser una cadena' })
  @IsOptional()
  doctorCedula?: string;

  @IsDateString({}, { message: 'La fecha objetivo debe tener formato YYYY-MM-DD' })
  @IsOptional()
  targetDate?: string;

  @IsDateString({}, { message: 'La fecha de inicio debe tener formato YYYY-MM-DD' })
  @IsOptional()
  startDate?: string;

  @IsDateString({}, { message: 'La fecha de fin debe tener formato YYYY-MM-DD' })
  @IsOptional()
  endDate?: string;
}

export class GetDailyAppointmentsDto implements IGetDailyAppointmentsRequest {
  @IsDateString({}, { message: 'La fecha debe tener un formato ISO válido (YYYY-MM-DD)' })
  @IsNotEmpty({ message: 'La fecha es obligatoria' })
  date!: string;

  @IsOptional()
  @IsEmail({}, { message: 'El correo del médico debe ser válido' })
  doctorEmail?: string;

  @IsOptional()
  @IsEnum(['TENTATIVE', 'CONFIRMED', 'CANCELLED'], {
    message: 'El estado debe ser TENTATIVE, CONFIRMED o CANCELLED',
  })
  status?: 'TENTATIVE' | 'CONFIRMED' | 'CANCELLED';
}

export class UpdateAppointmentStatusDto implements IUpdateAppointmentStatusRequest {
  @IsOptional()
  @IsString({ message: 'El ID de la cita debe ser una cadena de texto' })
  appointmentId?: string;

  @IsOptional()
  @IsString({ message: 'El identificador de la cita debe ser una cadena de texto' })
  id?: string;

  @IsEnum(['CONFIRMED', 'CANCELLED'], {
    message: 'El estado solo puede ser CONFIRMED o CANCELLED',
  })
  status!: 'CONFIRMED' | 'CANCELLED';
}

export class TrackContactDto implements ITrackContactRequest {
  @IsString({ message: 'El ID de la cita debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El ID de la cita es obligatorio' })
  appointmentId!: string;
}

// Aliases unificados
export { GetAvailableDatesQueryDto as GetAvailableDatesPayloadDto };
export { GetAvailableDatesQueryDto as GetAvailableDatesDto };
export { CreateAppointmentBodyDto as CreateAppointmentPayloadDto };
export { CreateWaitlistBodyDto as CreateWaitlistPayloadDto };
export { GetDailyAppointmentsDto as GetDailyAppointmentsQueryDto };
