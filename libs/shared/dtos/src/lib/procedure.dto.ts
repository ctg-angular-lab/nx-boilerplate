import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import {
  IFindProcedureByIdRequest,
  IFindProceduresByDoctorRequest,
} from '@nx-boilerplate/api-interfaces';

export class FindProcedureByIdDto implements IFindProcedureByIdRequest {
  @IsString({ message: 'El id del procedimiento debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El id del procedimiento es obligatorio' })
  idProcedimiento!: string;
}

export class FindProcedureParamDto implements IFindProcedureByIdRequest {
  @IsString({ message: 'El identificador del procedimiento debe ser un string' })
  @IsNotEmpty({ message: 'El identificador del procedimiento es requerido' })
  idProcedimiento!: string;
}

export class FindProceduresByDoctorDto implements IFindProceduresByDoctorRequest {
  @IsString({ message: 'La cédula del médico debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La cédula del médico es obligatoria' })
  doctorCedula!: string;
}

export class FilterProceduresQueryDto {
  @IsOptional()
  @IsString({ message: 'La cédula del médico debe ser un string' })
  doctorCedula?: string;
}
