import { Controller, Get, Inject, Param, Query } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { IProcedure } from '@nx-boilerplate/api-interfaces';
import {
  FindProcedureParamDto,
  FilterProceduresQueryDto,
} from '@nx-boilerplate/shared-dtos';
import { firstValueFrom, timeout } from 'rxjs';

@Controller('procedures')
export class ProceduresController {
  constructor(
    @Inject('PROCEDURES_SERVICE')
    private readonly proceduresClient: ClientProxy,
  ) {}

  @Get()
  async getProcedures(
    @Query() query: FilterProceduresQueryDto,
  ): Promise<IProcedure[]> {
    if (query.doctorCedula) {
      return firstValueFrom(
        this.proceduresClient
          .send<IProcedure[]>('procedures.find-by-doctor', {
            doctorCedula: query.doctorCedula,
          })
          .pipe(timeout(5000)),
      );
    }

    return firstValueFrom(
      this.proceduresClient
        .send<IProcedure[]>('procedures.get-all', {})
        .pipe(timeout(5000)),
    );
  }

  @Get(':idProcedimiento')
  async getProcedureById(
    @Param() params: FindProcedureParamDto,
  ): Promise<IProcedure> {
    return firstValueFrom(
      this.proceduresClient
        .send<IProcedure>('procedures.find-by-id', {
          idProcedimiento: params.idProcedimiento,
        })
        .pipe(timeout(5000)),
    );
  }

  @Get(':idProcedimiento/doctors')
  async getProcedureDoctors(@Param() params: FindProcedureParamDto): Promise<{
    idProcedimiento: string;
    nombreProcedimiento: string;
    medicosRelacionados: string[];
  }> {
    const procedure = await firstValueFrom(
      this.proceduresClient
        .send<IProcedure>('procedures.find-by-id', {
          idProcedimiento: params.idProcedimiento,
        })
        .pipe(timeout(5000)),
    );

    return {
      idProcedimiento: procedure.idProcedimiento,
      nombreProcedimiento: procedure.nombreProcedimiento,
      medicosRelacionados: procedure.medicosRelacionados,
    };
  }
}
