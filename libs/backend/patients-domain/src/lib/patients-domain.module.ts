import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Patient, PatientSchema } from './schemas/patient.schema';
import {
  ClinicalRecord,
  ClinicalRecordSchema,
} from './schemas/clinical-record.schema';
import { PatientsRepository } from './repositories/patients.repository';
import { ClinicalRecordsRepository } from './repositories/clinical-records.repository';
import { PatientsDomainService } from './services/patients-domain.service';
import { ClinicalRecordsDomainService } from './services/clinical-records-domain.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Patient.name, schema: PatientSchema },
      { name: ClinicalRecord.name, schema: ClinicalRecordSchema },
    ]),
  ],
  providers: [
    PatientsRepository,
    ClinicalRecordsRepository,
    PatientsDomainService,
    ClinicalRecordsDomainService,
  ],
  exports: [
    PatientsDomainService,
    ClinicalRecordsDomainService,
    PatientsRepository,
    ClinicalRecordsRepository,
  ],
})
export class PatientsDomainModule {}
