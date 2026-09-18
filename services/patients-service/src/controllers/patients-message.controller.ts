import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { FindPatientByNationalIdDto } from '@nx-boilerplate/shared-dtos';
import { IPatientHistory } from '@nx-boilerplate/api-interfaces';
import { PatientsDomainService } from '@nx-boilerplate/backend/patients-domain';

@Controller()
export class PatientsMessageController {
  constructor(private readonly patientsDomainService: PatientsDomainService) {}

  @MessagePattern('patients.find-by-national-id')
  async findByNationalId(
    @Payload() payload: FindPatientByNationalIdDto
  ): Promise<IPatientHistory> {
    return this.patientsDomainService.findByNationalId(payload.nationalId);
  }
}
