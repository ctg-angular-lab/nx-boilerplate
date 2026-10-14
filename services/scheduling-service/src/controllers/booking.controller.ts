import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import {
  BookingService,
  IBookAppointmentCommand,
} from '@nx-boilerplate/backend/scheduling-domain';
import {
  CreateAppointmentPayloadDto,
  CreateWaitlistPayloadDto,
} from '@nx-boilerplate/shared-dtos';

const DEFAULT_DOCTOR = {
  email: 'camilotabares.portafolio@gmail.com',
  cedula: '1020304050',
  name: 'Dr. Camilo Tabares García',
};

@Controller()
export class BookingController {
  private readonly logger = new Logger(BookingController.name);

  constructor(private readonly bookingService: BookingService) {}

  @MessagePattern('appointments.create')
  async createAppointment(@Payload() payload: CreateAppointmentPayloadDto) {
    this.logger.log(`Procesando reserva de cita para cédula: ${payload.cedula || payload.patientNationalId}`);

    let start: Date;
    let end: Date;

    if (payload.startTime && payload.endTime) {
      start = new Date(payload.startTime);
      end = new Date(payload.endTime);
    } else if (payload.fecha && payload.hora) {
      const [hours, minutes] = payload.hora.split(':').map(Number);
      start = new Date(payload.fecha);
      start.setHours(hours, minutes, 0, 0);
      end = new Date(start.getTime() + 45 * 60 * 1000);
    } else {
      throw new RpcException({
        statusCode: 400,
        message: 'Debe especificar fecha y hora o startTime y endTime válidos',
      });
    }

    const patientNationalId = (payload.patientNationalId || payload.cedula || '').trim();
    const patientFullName = (payload.patientFullName || `${payload.nombre || ''} ${payload.apellidos || ''}`).trim();
    const patientEmail = (payload.patientEmail || payload.correo || '').trim();
    const patientPhone = (payload.patientPhone || payload.celular || '').trim();
    const procedureId = (payload.procedureId || payload.procedimientoId || '').trim();
    const procedureName = payload.procedureName || payload.procedimientoNombre || `Procedimiento ${procedureId}`;

    const command: IBookAppointmentCommand = {
      doctorEmail: payload.doctorEmail || DEFAULT_DOCTOR.email,
      doctorCedula: payload.doctorCedula || DEFAULT_DOCTOR.cedula,
      patientNationalId,
      patientFullName,
      patientEmail,
      patientPhone,
      procedureId,
      procedureName,
      startTime: start,
      endTime: end,
      notes: payload.notes,
    };

    const appointment = await this.bookingService.bookAppointment(command);

    return {
      success: true,
      message: 'Cita reservada y sincronizada exitosamente con Google Calendar',
      appointmentId: appointment.appointmentId,
      googleCalendarEventId: appointment.googleCalendarEventId,
      status: appointment.status || 'TENTATIVE',
      colorId: appointment.colorId || '5',
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      doctor: DEFAULT_DOCTOR.name,
    };
  }

  @MessagePattern('waitlist.create')
  async createWaitlist(@Payload() payload: CreateWaitlistPayloadDto) {
    const patientName = payload.patientFullName || `${payload.nombre || ''} ${payload.apellidos || ''}`.trim();
    const procedureId = payload.procedureId || payload.procedimientoId;
    this.logger.log(`Registrando en lista de espera a: ${patientName}`);

    return {
      success: true,
      message: 'Registrado en lista de espera exitosamente. Te contactaremos ante una cancelación.',
      waitlistId: `WL-${Date.now()}`,
      patient: patientName,
      procedureId,
      registeredAt: new Date().toISOString(),
    };
  }
}
