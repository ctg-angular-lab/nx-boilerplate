import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  CreateProfessionalDto,
  DoctorCedulaPayloadDto,
  UpdateDoctorMessageDto,
  UpdateDoctorScheduleMessageDto,
} from '@nx-boilerplate/shared-dtos';
import { ProceduresDomainService } from '@nx-boilerplate/backend/procedures-domain';

@Controller()
export class DoctorsMessageController {
  constructor(
    private readonly proceduresDomainService: ProceduresDomainService
  ) {}

  @MessagePattern('doctors.create')
  async createDoctor(@Payload() payload: CreateProfessionalDto) {
    return this.proceduresDomainService.createProfessional(payload);
  }

  @MessagePattern('doctors.update')
  async updateDoctor(@Payload() payload: UpdateDoctorMessageDto) {
    return this.proceduresDomainService.updateProfessional(
      payload.cedula,
      payload.data
    );
  }

  @MessagePattern('doctors.update-schedule')
  async updateSchedule(@Payload() payload: UpdateDoctorScheduleMessageDto) {
    return this.proceduresDomainService.updateScheduleExceptions(
      payload.cedula,
      payload.exceptions
    );
  }

  @MessagePattern('doctors.soft-delete')
  async softDeleteDoctor(@Payload() payload: DoctorCedulaPayloadDto) {
    return this.proceduresDomainService.softDeleteProfessional(payload.cedula);
  }
}
