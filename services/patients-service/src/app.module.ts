import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PatientsDomainModule } from '@nx-boilerplate/backend/patients-domain';
import { PatientsMessageController } from './controllers/patients-message.controller';

@Module({
  imports: [
    MongooseModule.forRoot(process.env['MONGODB_URI'] || ''),
    PatientsDomainModule,
  ],
  controllers: [PatientsMessageController],
})
export class AppModule {}
