import { Controller, UsePipes, ValidationPipe } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  IActiveProfessional,
  IAreaCode,
  IMedicalCategory,
  IProcedure,
  IProcedureSoftDeleteResponse,
  IProfessionalSummary,
} from '@nx-boilerplate/api-interfaces';
import {
  CreateProcedureDto,
  FindProcedureByIdDto,
  FindProceduresByDoctorDto,
  GetDoctorsFilterDto,
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

  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @MessagePattern('doctors.get-all')
  async getAllDoctors(
    @Payload() payload?: GetDoctorsFilterDto
  ): Promise<IActiveProfessional[]> {
    return this.proceduresDomainService.getAllDoctors(payload);
  }

  @MessagePattern('area-codes.get-all')
  async getAllAreaCodes(): Promise<IAreaCode[]> {
    return this.proceduresDomainService.getAllAreaCodes();
  }

  @MessagePattern('categories.get-all')
  async getAllCategories(): Promise<IMedicalCategory[]> {
    return this.proceduresDomainService.getAllCategories(true);
  }
}
