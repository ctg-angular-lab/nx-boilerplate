import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PatientsDomainModule } from '@nx-boilerplate/backend/patients-domain';
import { PatientsMessageController } from './controllers/patients-message.controller';

@Module({
  imports: [
    MongooseModule.forRoot(
      process.env.MONGODB_URI ||
        'mongodb+srv://camilotabares84_db_user:YGer68cNPLDhTrBO@cluster0.fa2lvct.mongodb.net/appointments_db?retryWrites=true&w=majority&appName=Cluster0'
    ),
    PatientsDomainModule,
  ],
  controllers: [PatientsMessageController],
})
export class AppModule {}
