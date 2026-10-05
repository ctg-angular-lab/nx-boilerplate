import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Procedure, ProcedureSchema } from './schemas/procedure.schema';
import {
  ActiveProfessional,
  ActiveProfessionalSchema,
} from './schemas/active-professional.schema';
import { AreaCode, AreaCodeSchema } from './schemas/area-code.schema';
import { ProceduresRepository } from './repositories/procedures.repository';
import { ProceduresSeeder } from './seeders/procedures.seeder';
import { ProceduresDomainService } from './services/procedures-domain.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Procedure.name, schema: ProcedureSchema },
      { name: ActiveProfessional.name, schema: ActiveProfessionalSchema },
      { name: AreaCode.name, schema: AreaCodeSchema },
    ]),
  ],
  providers: [
    ProceduresRepository,
    ProceduresSeeder,
    ProceduresDomainService,
  ],
  exports: [ProceduresDomainService, ProceduresRepository],
})
export class ProceduresDomainModule {}

