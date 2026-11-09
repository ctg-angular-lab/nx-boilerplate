import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  CreatePatientDto,
  FindPatientByNationalIdDto,
  UpdatePatientMessageDto,
} from '@nx-boilerplate/shared-dtos';
import { IPatientHistory } from '@nx-boilerplate/api-interfaces';
import { PatientsDomainService } from '@nx-boilerplate/backend/patients-domain';

@Controller()
export class PatientsMessageController {
  constructor(private readonly patientsDomainService: PatientsDomainService) {}

  @MessagePattern('patients.find-all')
  async findAllPatients(): Promise<IPatientHistory[]> {
    return this.patientsDomainService.findAllPatients();
  }

  @MessagePattern('patients.find-by-national-id')
  async findByNationalId(
    @Payload() payload: FindPatientByNationalIdDto
  ): Promise<IPatientHistory> {
    return this.patientsDomainService.findByNationalId(payload.nationalId);
  }

  @MessagePattern('patients.create')
  async createPatient(
    @Payload() payload: CreatePatientDto
  ): Promise<IPatientHistory> {
    return this.patientsDomainService.createPatient(payload);
  }

  @MessagePattern('patients.update')
  async updatePatient(
    @Payload() payload: UpdatePatientMessageDto
  ): Promise<IPatientHistory> {
    return this.patientsDomainService.updatePatient(payload.nationalId, payload.data);
  }
}
