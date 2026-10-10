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
import {
  IAppointmentDashboard,
  IAvailableDate,
  IDayAvailability,
} from '@nx-boilerplate/api-interfaces';
import {
  GetDailyAppointmentsQueryDto,
  UpdateAppointmentStatusDto,
} from '@nx-boilerplate/shared-dtos';
import { firstValueFrom, timeout } from 'rxjs';
import {
  CreateAppointmentBodyDto,
  CreateWaitlistBodyDto,
  GetAvailableDatesQueryDto,
} from '../dtos/appointment-gateway.dto';
import { getWeekWindow } from '@nx-boilerplate/utils';

@Controller('appointments')
export class AppointmentsController {
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

  @Get('available-dates')
  async getAvailableDates(
    @Query() query: GetAvailableDatesQueryDto,
  ): Promise<IAvailableDate[] | IDayAvailability[]> {
    let startDate = query.startDate;
    let endDate = query.endDate;

    if (!startDate || !endDate) {
      const window = getWeekWindow(0);
      startDate = startDate || window.startDate;
      endDate = endDate || window.endDate;
    }

    const payload = {
      ...query,
      startDate,
      endDate,
    };

    return firstValueFrom(
      this.schedulingClient
        .send<IAvailableDate[] | IDayAvailability[]>(
          'appointments.get-available-dates',
          payload,
        )
        .pipe(timeout(10000)),
    );
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createAppointment(@Body() body: CreateAppointmentBodyDto) {
    const result = await firstValueFrom(
      this.schedulingClient
        .send('appointments.create', body)
        .pipe(timeout(10000)),
    );

    return {
      ...result,
      status: 'TENTATIVE',
      colorId: '5',
    };
  }

  @Patch(':id/status')
  async updateAppointmentStatus(
    @Param('id') id: string,
    @Body() body: UpdateAppointmentStatusDto,
  ): Promise<IAppointmentDashboard> {
    return firstValueFrom(
      this.schedulingClient
        .send<IAppointmentDashboard>('appointments.update-status', {
          id,
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

  @Post('waitlist')
  @HttpCode(HttpStatus.CREATED)
  async createWaitlist(@Body() body: CreateWaitlistBodyDto) {
    return firstValueFrom(
      this.schedulingClient
        .send('waitlist.create', body)
        .pipe(timeout(5000)),
    );
  }
}


