import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Patient, PatientSchema } from './schemas/patient.schema';
import {
  ClinicalRecord,
  ClinicalRecordSchema,
} from './schemas/clinical-record.schema';
import { PatientsRepository } from './repositories/patients.repository';
import { ClinicalRecordsRepository } from './repositories/clinical-records.repository';
import { ProfessionalNamesRepository } from './repositories/professional-names.repository';
import {
  ProfessionalNameReadModel,
  ProfessionalNameSchema,
} from './schemas/professional-name.read-model';
import { PatientsDomainService } from './services/patients-domain.service';
import { ClinicalRecordsDomainService } from './services/clinical-records-domain.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Patient.name, schema: PatientSchema },
      { name: ClinicalRecord.name, schema: ClinicalRecordSchema },
      { name: ProfessionalNameReadModel.name, schema: ProfessionalNameSchema },
    ]),
  ],
  providers: [
    PatientsRepository,
    ClinicalRecordsRepository,
    ProfessionalNamesRepository,
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
