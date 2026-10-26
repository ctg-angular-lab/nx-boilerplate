import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  IProcedure,
  IProcedureSoftDeleteResponse,
  IProfessionalSummary,
} from '@nx-boilerplate/api-interfaces';
import {
  CreateProcedureDto,
  FilterProceduresQueryDto,
  FindProcedureParamDto,
  UpdateProcedureDto,
} from '@nx-boilerplate/shared-dtos';
import { Observable, timeout } from 'rxjs';

@Controller('procedures')
export class ProceduresController {
  constructor(
    @Inject('PROCEDURES_SERVICE')
    private readonly proceduresClient: ClientProxy,
  ) {}

  @Get()
  getProcedures(
    @Query() query: FilterProceduresQueryDto,
  ): Observable<IProcedure[]> {
    if (query?.doctorCedula) {
      return this.proceduresClient
        .send<IProcedure[]>('procedures.find-by-doctor', {
          doctorCedula: query.doctorCedula,
        })
        .pipe(timeout(5000));
    }

    return this.proceduresClient
      .send<IProcedure[]>('procedures.get-all', {
        includeInactive: query?.includeInactive,
      })
      .pipe(timeout(5000));
  }

  @Post()
  createProcedure(
    @Body() payload: CreateProcedureDto,
  ): Observable<IProcedure> {
    return this.proceduresClient
      .send<IProcedure>('procedures.create', payload)
      .pipe(timeout(5000));
  }

  @Patch(':idProcedimiento')
  updateProcedure(
    @Param() params: FindProcedureParamDto,
    @Body() payload: UpdateProcedureDto,
  ): Observable<IProcedure> {
    return this.proceduresClient
      .send<IProcedure>('procedures.update', {
        idProcedimiento: params.idProcedimiento,
        data: payload,
      })
      .pipe(timeout(10000));
  }

  @Delete(':idProcedimiento')
  softDeleteProcedure(
    @Param() params: FindProcedureParamDto,
  ): Observable<IProcedureSoftDeleteResponse> {
    return this.proceduresClient
      .send<IProcedureSoftDeleteResponse>('procedures.soft-delete', {
        idProcedimiento: params.idProcedimiento,
      })
      .pipe(timeout(5000));
  }

  @Get(':idProcedimiento')
  getProcedureById(
    @Param() params: FindProcedureParamDto,
  ): Observable<IProcedure> {
    return this.proceduresClient
      .send<IProcedure>('procedures.find-by-id', {
        idProcedimiento: params.idProcedimiento,
      })
      .pipe(timeout(5000));
  }

  @Get(':idProcedimiento/doctors')
  getProcedureDoctors(
    @Param() params: FindProcedureParamDto,
  ): Observable<IProfessionalSummary[]> {
    return this.proceduresClient
      .send<IProfessionalSummary[]>('procedures.get-doctors-by-procedure', {
        idProcedimiento: params.idProcedimiento,
      })
      .pipe(timeout(5000));
  }
}
