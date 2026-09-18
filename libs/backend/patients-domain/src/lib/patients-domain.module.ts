import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Patient, PatientSchema } from './schemas/patient.schema';
import { PatientsRepository } from './repositories/patients.repository';
import { PatientsDomainService } from './services/patients-domain.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Patient.name, schema: PatientSchema },
    ]),
  ],
  providers: [PatientsRepository, PatientsDomainService],
  exports: [PatientsDomainService, PatientsRepository],
})
export class PatientsDomainModule {}
