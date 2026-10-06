import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Query,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { IAvailableDate, IDayAvailability } from '@nx-boilerplate/api-interfaces';
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

