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
  Query,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { IAppointmentDashboard } from '@nx-boilerplate/api-interfaces';
import {
  GetDailyAppointmentsQueryDto,
  UpdateAppointmentStatusDto,
} from '@nx-boilerplate/shared-dtos';
import { firstValueFrom, timeout } from 'rxjs';

@Controller('appointments')
export class AppointmentConfirmationController {
  constructor(
    @Inject('SCHEDULING_SERVICE')
    private readonly schedulingClient: ClientProxy,
  ) {}

  @Get('daily')
  async getDailyAppointments(
    @Query() query: GetDailyAppointmentsQueryDto,
  ): Promise<IAppointmentDashboard[]> {
    return firstValueFrom(
      this.schedulingClient
        .send<IAppointmentDashboard[]>('appointments.get-daily', query)
        .pipe(timeout(5000)),
    );
  }

  @Patch(':id/status')
  async updateAppointmentStatus(
    @Param('id') id: string,
    @Body() body: UpdateAppointmentStatusDto,
  ): Promise<IAppointmentDashboard> {
    return firstValueFrom(
      this.schedulingClient
        .send<IAppointmentDashboard>('appointments.update-status', {
          appointmentId: id,
          status: body.status,
        })
        .pipe(timeout(10000)),
    );
  }

  @Post(':id/track-contact')
  @HttpCode(HttpStatus.ACCEPTED)
  async trackContact(@Param('id') id: string) {
    this.schedulingClient.emit('appointments.contact-tracked', {
      appointmentId: id,
    });

    return {
      message: 'Registro de contacto encolado exitosamente',
    };
  }
}
