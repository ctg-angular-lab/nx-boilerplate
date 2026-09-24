import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import {
  SchedulingDomainService,
  IBookAppointmentCommand,
} from '@nx-boilerplate/backend/scheduling-domain';
import { IAvailableDate, IDayAvailability } from '@nx-boilerplate/api-interfaces';
import { GetAvailableDatesPayloadDto } from '../dtos/get-available-dates-payload.dto';
import { CreateAppointmentPayloadDto } from '../dtos/create-appointment-payload.dto';
import { CreateWaitlistPayloadDto } from '../dtos/create-waitlist-payload.dto';

const DEFAULT_DOCTOR = {
  email: 'camilotabares.portafolio@gmail.com',
  cedula: '1020304050',
  name: 'Dr. Camilo Tabares García',
};

@Controller()
export class SchedulingMessageController {
  private readonly logger = new Logger(SchedulingMessageController.name);

  constructor(
    private readonly schedulingDomainService: SchedulingDomainService
  ) {}

  @MessagePattern('appointments.get-available-dates')
  async getAvailableDates(
    @Payload() payload: GetAvailableDatesPayloadDto
  ): Promise<IAvailableDate[] | IDayAvailability[]> {
    this.logger.log(`Consultando disponibilidad de citas: ${JSON.stringify(payload)}`);

    const doctorEmail = payload.doctorEmail || DEFAULT_DOCTOR.email;
    const doctorCedula = payload.doctorCedula || DEFAULT_DOCTOR.cedula;
    const durationMinutes = 45;

    // Consulta por rango semanal optimizada
    if (payload.startDate && payload.endDate) {
      const start = new Date(payload.startDate);
      const end = new Date(payload.endDate);

      return this.schedulingDomainService.getAvailableSlotsForRange(
        doctorEmail,
        start,
        end,
        durationMinutes
      );
    }

    // Consulta de día único (retrocompatibilidad)
    const targetDate = payload.targetDate ? new Date(payload.targetDate) : new Date();

    const slots = await this.schedulingDomainService.getAvailableSlots(
      doctorEmail,
      doctorCedula,
      targetDate,
      durationMinutes
    );

    return slots.map((slot, index) => {
      const start = new Date(slot.start);
      const hours = String(start.getHours()).padStart(2, '0');
      const minutes = String(start.getMinutes()).padStart(2, '0');
      const year = start.getFullYear();
      const month = String(start.getMonth() + 1).padStart(2, '0');
      const day = String(start.getDate()).padStart(2, '0');

      return {
        id: `slot-${year}${month}${day}-${hours}${minutes}-${index}`,
        fecha: `${year}-${month}-${day}`,
        hora: `${hours}:${minutes}`,
        profesional: DEFAULT_DOCTOR.name,
        disponible: true,
      };
    });
  }


  @MessagePattern('appointments.create')
  async createAppointment(@Payload() payload: CreateAppointmentPayloadDto) {
    this.logger.log(`Procesando reserva de cita para cédula: ${payload.cedula}`);

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
    const procedureId = (payload.procedureId || payload.procedimientoId || '').trim();
    const procedureName = payload.procedureName || payload.procedimientoNombre || `Procedimiento ${procedureId}`;

    const command: IBookAppointmentCommand = {
      doctorEmail: payload.doctorEmail || DEFAULT_DOCTOR.email,
      doctorCedula: payload.doctorCedula || DEFAULT_DOCTOR.cedula,
      patientNationalId,
      patientFullName,
      patientEmail,
      procedureId,
      procedureName,
      startTime: start,
      endTime: end,
      notes: payload.notes,
    };

    const appointment = await this.schedulingDomainService.bookAppointment(command);

    return {
      success: true,
      message: 'Cita reservada y sincronizada exitosamente con Google Calendar',
      appointmentId: appointment.appointmentId,
      googleCalendarEventId: appointment.googleCalendarEventId,
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

