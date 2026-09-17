import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { HealthController } from './controllers/health.controller';
import { PatientsController } from './controllers/patients.controller';
import { AppointmentsController } from './controllers/appointments.controller';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'PATIENTS_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URI || 'amqp://localhost:5672'],
          queue: process.env.PATIENTS_QUEUE || 'patients_queue',
          queueOptions: {
            durable: true,
          },
        },
      },
      {
        name: 'SCHEDULING_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URI || 'amqp://localhost:5672'],
          queue: process.env.SCHEDULING_QUEUE || 'scheduling_queue',
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
  ],
  controllers: [HealthController, PatientsController, AppointmentsController],
})
export class AppModule {}
