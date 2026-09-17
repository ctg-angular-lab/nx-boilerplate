import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Query,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  CreateAppointmentDto,
  CreateWaitlistDto,
  GetAvailableDatesQueryDto,
} from '@nx-boilerplate/shared-dtos';
import { IAvailableDate } from '@nx-boilerplate/api-interfaces';
import { firstValueFrom } from 'rxjs';

@Controller('appointments')
export class AppointmentsController {
  constructor(
    @Inject('SCHEDULING_SERVICE') private readonly schedulingClient: ClientProxy,
  ) {}

  @Get('available-dates')
  async getAvailableDates(
    @Query() query: GetAvailableDatesQueryDto,
  ): Promise<IAvailableDate[]> {
    return firstValueFrom(
      this.schedulingClient.send<IAvailableDate[]>(
        'appointments.get-available-dates',
        query,
      ),
    );
  }

  @Post()
  async createAppointment(@Body() dto: CreateAppointmentDto) {
    return firstValueFrom(
      this.schedulingClient.send('appointments.create', dto),
    );
  }

  @Post('waitlist')
  async addToWaitlist(@Body() dto: CreateWaitlistDto) {
    return firstValueFrom(
      this.schedulingClient.send('waitlist.create', dto),
    );
  }
}
