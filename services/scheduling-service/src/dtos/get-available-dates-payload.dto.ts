import { IsOptional, IsString } from 'class-validator';
import { IGetAvailableDatesRequest } from '@nx-boilerplate/api-interfaces';

export class GetAvailableDatesPayloadDto implements IGetAvailableDatesRequest {
  @IsOptional()
  @IsString({ message: 'El ID del procedimiento debe ser una cadena de texto' })
  procedureId?: string;

  @IsOptional()
  @IsString({ message: 'El correo del médico debe ser una cadena de texto' })
  doctorEmail?: string;

  @IsOptional()
  @IsString({ message: 'La cédula del médico debe ser una cadena de texto' })
  doctorCedula?: string;

  @IsOptional()
  @IsString({ message: 'La fecha objetivo debe ser una cadena de texto' })
  targetDate?: string;

  @IsOptional()
  @IsString({ message: 'La fecha de inicio debe ser una cadena de texto' })
  startDate?: string;

  @IsOptional()
  @IsString({ message: 'La fecha de fin debe ser una cadena de texto' })
  endDate?: string;
}

