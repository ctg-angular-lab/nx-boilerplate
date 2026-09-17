import { Controller, Get, Inject, Param } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { FindPatientByNationalIdDto } from '@nx-boilerplate/shared-dtos';
import { IPatientHistory } from '@nx-boilerplate/api-interfaces';
import { firstValueFrom } from 'rxjs';

@Controller('patients')
export class PatientsController {
  constructor(
    @Inject('PATIENTS_SERVICE') private readonly patientsClient: ClientProxy,
  ) {}

  @Get(':nationalId')
  async getPatientByNationalId(
    @Param() params: FindPatientByNationalIdDto,
  ): Promise<IPatientHistory> {
    return firstValueFrom(
      this.patientsClient.send<IPatientHistory>(
        'patients.find-by-national-id',
        { nationalId: params.nationalId },
      ),
    );
  }
}
