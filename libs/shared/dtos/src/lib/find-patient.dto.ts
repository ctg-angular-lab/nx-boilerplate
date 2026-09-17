import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';
import { IFindPatientByNationalIdRequest } from '@nx-boilerplate/api-interfaces';

export class FindPatientByNationalIdDto implements IFindPatientByNationalIdRequest {
  @IsString({ message: 'El documento de identidad debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El documento de identidad es obligatorio' })
  @Length(5, 20, { message: 'El documento de identidad debe tener entre 5 y 20 caracteres' })
  @Matches(/^[a-zA-Z0-9]+$/, {
    message: 'El documento de identidad solo admite caracteres alfanuméricos',
  })
  nationalId!: string;
}
