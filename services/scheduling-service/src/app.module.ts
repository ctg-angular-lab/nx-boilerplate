import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SchedulingDomainModule } from '@nx-boilerplate/backend/scheduling-domain';
import { SchedulingMessageController } from './controllers/scheduling-message.controller';

@Module({
  imports: [
    MongooseModule.forRoot(
      process.env['MONGODB_URI'] ||
        'mongodb+srv://camilotabares84_db_user:YGer68cNPLDhTrBO@cluster0.fa2lvct.mongodb.net/appointments_db?retryWrites=true&w=majority&appName=Cluster0'
    ),
    SchedulingDomainModule,
  ],
  controllers: [SchedulingMessageController],
})
export class AppModule {}
