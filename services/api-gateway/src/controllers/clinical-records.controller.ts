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
  CreateClinicalRecordDto,
  FindClinicalRecordByIdDto,
  UpdateClinicalRecordDto,
} from '@nx-boilerplate/shared-dtos';
import { ICitaMedica } from '@nx-boilerplate/api-interfaces';
import { firstValueFrom, timeout } from 'rxjs';

@Controller('clinical-records')
export class ClinicalRecordsController {
  constructor(
    @Inject('PATIENTS_SERVICE') private readonly patientsClient: ClientProxy,
  ) {}

  @Get(':id')
  async getClinicalRecordById(
    @Param() params: FindClinicalRecordByIdDto,
  ): Promise<ICitaMedica> {
    return firstValueFrom(
      this.patientsClient
        .send<ICitaMedica>('clinical-records.find-by-id', { id: params.id })
        .pipe(timeout(5000))
    );
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createClinicalRecord(
    @Body() createClinicalRecordDto: CreateClinicalRecordDto,
  ): Promise<ICitaMedica> {
    return firstValueFrom(
      this.patientsClient
        .send<ICitaMedica>('clinical-records.create', createClinicalRecordDto)
        .pipe(timeout(5000))
    );
  }

  @Patch(':id')
  async updateClinicalRecord(
    @Param() params: FindClinicalRecordByIdDto,
    @Body() updateClinicalRecordDto: UpdateClinicalRecordDto,
  ): Promise<ICitaMedica> {
    return firstValueFrom(
      this.patientsClient
        .send<ICitaMedica>('clinical-records.update', {
          id: params.id,
          data: updateClinicalRecordDto,
        })
        .pipe(timeout(10000))
    );
  }
}

