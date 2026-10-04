import { Body, Controller, Get, HttpCode, HttpStatus, Inject, Param, Post } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CreatePatientDto, FindPatientByNationalIdDto } from '@nx-boilerplate/shared-dtos';
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

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createPatient(
    @Body() createPatientDto: CreatePatientDto,
  ): Promise<IPatientHistory> {
    return firstValueFrom(
      this.patientsClient.send<IPatientHistory>(
        'patients.create',
        createPatientDto,
      ),
    );
  }
}

