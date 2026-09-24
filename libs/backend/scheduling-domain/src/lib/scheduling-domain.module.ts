import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Appointment, AppointmentSchema } from './schemas/appointment.schema';
import { AppointmentRepository } from './repositories/appointment.repository';
import { SchedulingDomainService } from './services/scheduling-domain.service';
import { CALENDAR_PROVIDER } from './ports/calendar-provider.port';
import { GoogleCalendarAdapter } from './adapters/google-calendar.adapter';
import { MockCalendarAdapter } from './adapters/mock-calendar.adapter';

const useGoogleReal = process.env['USE_GOOGLE_CALENDAR'] === 'true';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Appointment.name, schema: AppointmentSchema },
    ]),
  ],
  providers: [
    AppointmentRepository,
    SchedulingDomainService,
    {
      provide: CALENDAR_PROVIDER,
      useClass: useGoogleReal ? GoogleCalendarAdapter : MockCalendarAdapter,
    },
  ],
  exports: [SchedulingDomainService, CALENDAR_PROVIDER, AppointmentRepository],
})
export class SchedulingDomainModule {}
