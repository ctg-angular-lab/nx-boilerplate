import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Appointment, AppointmentSchema } from './schemas/appointment.schema';
import { AppointmentRepository } from './repositories/appointment.repository';
import { SchedulingDomainService } from './services/scheduling-domain.service';
import { WorkScheduleService } from './services/work-schedule.service';
import { AvailabilityService } from './services/availability.service';
import { BookingService } from './services/booking.service';
import { AppointmentTrackingService } from './services/appointment-tracking.service';
import { CALENDAR_PROVIDER } from './ports/calendar-provider.port';
import { GoogleCalendarAdapter } from './adapters/google-calendar.adapter';
import { MockCalendarAdapter } from './adapters/mock-calendar.adapter';
import { PROFESSIONAL_SCHEDULE_PROVIDER } from './ports/professional-schedule-provider.port';
import { MongoProfessionalScheduleAdapter } from './adapters/mongo-professional-schedule.adapter';
import {
  ProfessionalScheduleReadModel,
  ProfessionalScheduleSchema,
} from './schemas/professional-schedule.read-model';

const useGoogleReal = process.env['USE_GOOGLE_CALENDAR'] === 'true';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Appointment.name, schema: AppointmentSchema },
      { name: ProfessionalScheduleReadModel.name, schema: ProfessionalScheduleSchema },
    ]),
  ],
  providers: [
    AppointmentRepository,
    WorkScheduleService,
    AvailabilityService,
    BookingService,
    AppointmentTrackingService,
    SchedulingDomainService,
    {
      provide: CALENDAR_PROVIDER,
      useClass: useGoogleReal ? GoogleCalendarAdapter : MockCalendarAdapter,
    },
    {
      provide: PROFESSIONAL_SCHEDULE_PROVIDER,
      useClass: MongoProfessionalScheduleAdapter,
    },
  ],
  exports: [
    WorkScheduleService,
    AvailabilityService,
    BookingService,
    AppointmentTrackingService,
    SchedulingDomainService,
    CALENDAR_PROVIDER,
    PROFESSIONAL_SCHEDULE_PROVIDER,
    AppointmentRepository,
  ],
})
export class SchedulingDomainModule {}
