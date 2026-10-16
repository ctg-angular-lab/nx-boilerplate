import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Observable, timeout } from 'rxjs';
import { IActiveProfessional } from '@nx-boilerplate/api-interfaces';
import {
  CreateProfessionalDto,
  UpdateProfessionalDto,
  UpdateScheduleExceptionsDto,
} from '@nx-boilerplate/shared-dtos';

@Controller('doctors')
export class DoctorsController {
  constructor(
    @Inject('PROCEDURES_SERVICE')
    private readonly proceduresClient: ClientProxy
  ) {}

  @Get()
  getAllDoctors(): Observable<IActiveProfessional[]> {
    return this.proceduresClient
      .send<IActiveProfessional[]>('doctors.get-all', {})
      .pipe(timeout(5000));
  }

  @Post()
  createDoctor(@Body() body: CreateProfessionalDto): Observable<unknown> {
    return this.proceduresClient
      .send('doctors.create', body)
      .pipe(timeout(5000));
  }

  @Patch(':cedula')
  updateDoctor(
    @Param('cedula') cedula: string,
    @Body() data: UpdateProfessionalDto
  ): Observable<unknown> {
    return this.proceduresClient
      .send('doctors.update', { cedula, data })
      .pipe(timeout(10000));
  }

  @Patch(':cedula/schedule')
  updateSchedule(
    @Param('cedula') cedula: string,
    @Body() body: UpdateScheduleExceptionsDto
  ): Observable<unknown> {
    const exceptions = body.horariosExcepcionales || body.exceptions || [];
    return this.proceduresClient
      .send('doctors.update-schedule', { cedula, exceptions })
      .pipe(timeout(5000));
  }

  @Delete(':cedula')
  softDeleteDoctor(@Param('cedula') cedula: string): Observable<unknown> {
    return this.proceduresClient
      .send('doctors.soft-delete', { cedula })
      .pipe(timeout(5000));
  }
}
