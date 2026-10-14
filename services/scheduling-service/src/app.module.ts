import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SchedulingDomainModule } from '@nx-boilerplate/backend/scheduling-domain';
import { AvailabilityController } from './controllers/availability.controller';
import { BookingController } from './controllers/booking.controller';
import { ConfirmationController } from './controllers/confirmation.controller';

@Module({
  imports: [
    MongooseModule.forRoot(process.env['MONGODB_URI'] || ''),
    SchedulingDomainModule,
  ],
  controllers: [
    AvailabilityController,
    BookingController,
    ConfirmationController,
  ],
})
export class AppModule {}
