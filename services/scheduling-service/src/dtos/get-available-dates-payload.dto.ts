import { IsOptional, IsString } from 'class-validator';

export class GetAvailableDatesPayloadDto {
  @IsOptional()
  @IsString()
  procedureId?: string;

  @IsOptional()
  @IsString()
  doctorEmail?: string;

  @IsOptional()
  @IsString()
  doctorCedula?: string;

  @IsOptional()
  @IsString()
  targetDate?: string;
}
