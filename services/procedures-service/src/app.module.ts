import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProceduresDomainModule } from '@nx-boilerplate/backend/procedures-domain';
import { ProceduresMessageController } from './controllers/procedures-message.controller';
import { DoctorsMessageController } from './controllers/doctors-message.controller';

@Module({
  imports: [
    MongooseModule.forRoot(process.env['MONGODB_URI'] || ''),
    ProceduresDomainModule,
  ],
  controllers: [ProceduresMessageController, DoctorsMessageController],
})
export class AppModule {}
