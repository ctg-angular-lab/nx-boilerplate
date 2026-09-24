import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateWaitlistPayloadDto {
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
  patientPhone?: string;

  @IsOptional()
  @IsString()
  procedureId?: string;

  @IsOptional()
  @IsEmail()
  preferredDoctorEmail?: string;

}
