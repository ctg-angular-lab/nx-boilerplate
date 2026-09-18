import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { IProcedure } from '@nx-boilerplate/api-interfaces';
import {
  FindProcedureByIdDto,
  FindProceduresByDoctorDto,
} from '@nx-boilerplate/shared-dtos';
import { ProceduresDomainService } from '@nx-boilerplate/backend/procedures-domain';

@Controller()
export class ProceduresMessageController {
  constructor(
    private readonly proceduresDomainService: ProceduresDomainService
  ) {}

  @MessagePattern('procedures.get-all')
  async getAll(): Promise<IProcedure[]> {
    return this.proceduresDomainService.getAll();
  }

  @MessagePattern('procedures.find-by-id')
  async findById(@Payload() payload: FindProcedureByIdDto): Promise<IProcedure> {
    return this.proceduresDomainService.getById(payload.idProcedimiento);
  }

  @MessagePattern('procedures.find-by-doctor')
  async findByDoctor(
    @Payload() payload: FindProceduresByDoctorDto
  ): Promise<IProcedure[]> {
    return this.proceduresDomainService.getByDoctor(payload.doctorCedula);
  }
}
