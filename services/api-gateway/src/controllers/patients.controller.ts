import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  CreatePatientDto,
  FindPatientByNationalIdDto,
  UpdatePatientDto,
} from '@nx-boilerplate/shared-dtos';
import { ICitaMedica, IPatientHistory } from '@nx-boilerplate/api-interfaces';
import { firstValueFrom, timeout } from 'rxjs';

@Controller('patients')
export class PatientsController {
  constructor(
    @Inject('PATIENTS_SERVICE') private readonly patientsClient: ClientProxy,
  ) {}

  @Get()
  async getAllPatients(): Promise<IPatientHistory[]> {
    return firstValueFrom(
      this.patientsClient
        .send<IPatientHistory[]>('patients.find-all', {})
        .pipe(timeout(5000))
    );
  }

  @Get(':nationalId')
  async getPatientByNationalId(
    @Param() params: FindPatientByNationalIdDto,
  ): Promise<IPatientHistory> {
    return firstValueFrom(
      this.patientsClient
        .send<IPatientHistory>('patients.find-by-national-id', {
          nationalId: params.nationalId,
        })
        .pipe(timeout(5000))
    );
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createPatient(
    @Body() createPatientDto: CreatePatientDto,
  ): Promise<IPatientHistory> {
    return firstValueFrom(
      this.patientsClient
        .send<IPatientHistory>('patients.create', createPatientDto)
        .pipe(timeout(5000))
    );
  }

  @Patch(':nationalId')
  async updatePatient(
    @Param() params: FindPatientByNationalIdDto,
    @Body() updatePatientDto: UpdatePatientDto,
  ): Promise<IPatientHistory> {
    return firstValueFrom(
      this.patientsClient
        .send<IPatientHistory>('patients.update', {
          nationalId: params.nationalId,
          data: updatePatientDto,
        })
        .pipe(timeout(5000))
    );
  }

  @Get(':nationalId/clinical-records')
  async getPatientClinicalRecords(
    @Param() params: FindPatientByNationalIdDto,
  ): Promise<ICitaMedica[]> {
    return firstValueFrom(
      this.patientsClient
        .send<ICitaMedica[]>('clinical-records.find-by-patient', {
          nationalId: params.nationalId,
        })
        .pipe(timeout(5000))
    );
  }
}
