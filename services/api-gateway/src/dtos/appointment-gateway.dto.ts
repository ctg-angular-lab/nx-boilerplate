import {
  IsDateString,
  IsEmail,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class GetAvailableDatesQueryDto {
  @IsString({ message: 'El ID del procedimiento es requerido' })
  @IsNotEmpty({ message: 'El ID del procedimiento no puede estar vacío' })
  procedureId!: string;

  @IsEmail({}, { message: 'El formato de correo del médico no es válido' })
  @IsOptional()
  doctorEmail?: string;

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

export class CreateAppointmentBodyDto {
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
}
