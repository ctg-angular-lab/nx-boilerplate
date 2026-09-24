import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProceduresDomainModule } from '@nx-boilerplate/backend/procedures-domain';
import { ProceduresMessageController } from './controllers/procedures-message.controller';

@Module({
  imports: [
    MongooseModule.forRoot(
      process.env.MONGODB_URI ||
        'mongodb+srv://camilotabares84_db_user:YGer68cNPLDhTrBO@cluster0.fa2lvct.mongodb.net/appointments_db?retryWrites=true&w=majority&appName=Cluster0'
    ),
    ProceduresDomainModule,
  ],
  controllers: [ProceduresMessageController],
})
export class AppModule {}
