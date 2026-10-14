import { Controller, Logger } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { AppointmentTrackingService } from '@nx-boilerplate/backend/scheduling-domain';
import {
  GetDailyAppointmentsDto,
  TrackContactDto,
  UpdateAppointmentStatusDto,
} from '@nx-boilerplate/shared-dtos';

@Controller()
export class ConfirmationController {
  private readonly logger = new Logger(ConfirmationController.name);

  constructor(private readonly trackingService: AppointmentTrackingService) {}

  @MessagePattern('appointments.get-daily')
  async getDailyAppointments(@Payload() payload: GetDailyAppointmentsDto) {
    this.logger.log(`Consultando citas diarias para fecha: ${payload.date}`);
    return this.trackingService.getDailyAppointments(payload);
  }

  @MessagePattern('appointments.update-status')
  async updateAppointmentStatus(@Payload() payload: UpdateAppointmentStatusDto) {
    this.logger.log(
      `Actualizando estado de cita ${payload.appointmentId || payload.id} a ${payload.status}`
    );
    const appointmentId = (payload.appointmentId || payload.id || '').trim();
    return this.trackingService.updateAppointmentStatus(appointmentId, payload.status);
  }

  @EventPattern('appointments.contact-tracked')
  async handleContactTracked(@Payload() payload: TrackContactDto): Promise<void> {
    this.logger.log(`Evento de contacto registrado para cita: ${payload.appointmentId}`);
    await this.trackingService.incrementContactCount(payload.appointmentId);
  }
}
