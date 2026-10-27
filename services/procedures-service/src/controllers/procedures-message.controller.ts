import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  IActiveProfessional,
  IAreaCode,
  IProcedure,
  IProcedureSoftDeleteResponse,
  IProfessionalSummary,
} from '@nx-boilerplate/api-interfaces';
import {
  CreateProcedureDto,
  FindProcedureByIdDto,
  FindProceduresByDoctorDto,
  GetDoctorsMessageDto,
  GetProceduresMessageDto,
  UpdateProcedureMessageDto,
} from '@nx-boilerplate/shared-dtos';
import { ProceduresDomainService } from '@nx-boilerplate/backend/procedures-domain';

@Controller()
export class ProceduresMessageController {
  constructor(
    private readonly proceduresDomainService: ProceduresDomainService
  ) {}

  @MessagePattern('procedures.get-all')
  async getAll(
    @Payload() payload?: GetProceduresMessageDto
  ): Promise<IProcedure[]> {
    return this.proceduresDomainService.getAll(
      payload?.includeInactive ?? false
    );
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

  @MessagePattern('procedures.get-doctors-by-procedure')
  async getDoctorsByProcedure(
    @Payload() payload: FindProcedureByIdDto
  ): Promise<IProfessionalSummary[]> {
    return this.proceduresDomainService.getDoctorsByProcedureId(
      payload.idProcedimiento
    );
  }

  @MessagePattern('procedures.create')
  async createProcedure(
    @Payload() payload: CreateProcedureDto
  ): Promise<IProcedure> {
    return this.proceduresDomainService.createProcedure(payload);
  }

  @MessagePattern('procedures.update')
  async updateProcedure(
    @Payload() payload: UpdateProcedureMessageDto
  ): Promise<IProcedure> {
    return this.proceduresDomainService.updateProcedure(
      payload.idProcedimiento,
      payload.data
    );
  }

  @MessagePattern('procedures.soft-delete')
  async softDeleteProcedure(
    @Payload() payload: FindProcedureByIdDto
  ): Promise<IProcedureSoftDeleteResponse> {
    return this.proceduresDomainService.softDeleteProcedure(
      payload.idProcedimiento
    );
  }

  @MessagePattern('doctors.get-all')
  async getAllDoctors(
    @Payload() payload: GetDoctorsMessageDto
  ): Promise<IActiveProfessional[]> {
    return this.proceduresDomainService.getAllDoctors(
      payload?.includeInactive ?? false
    );
  }

  @MessagePattern('area-codes.get-all')
  async getAllAreaCodes(): Promise<IAreaCode[]> {
    return this.proceduresDomainService.getAllAreaCodes();
  }
}
