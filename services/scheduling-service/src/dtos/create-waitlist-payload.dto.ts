import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateWaitlistPayloadDto {
  @IsString()
  @IsNotEmpty()
  cedula!: string;

  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @IsString()
  @IsNotEmpty()
  apellidos!: string;

  @IsEmail()
  @IsNotEmpty()
  correo!: string;

  @IsString()
  @IsNotEmpty()
  celular!: string;

  @IsString()
  @IsNotEmpty()
  procedimientoId!: string;

  @IsOptional()
  @IsEmail()
  preferredDoctorEmail?: string;
}
