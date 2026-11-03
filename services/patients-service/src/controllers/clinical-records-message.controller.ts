import { Controller, Logger } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import {
  AppointmentConfirmedEventDto,
  CreateClinicalRecordDto,
  FindClinicalRecordByIdDto,
  FindPatientByNationalIdDto,
  UpdateClinicalRecordMessageDto,
} from '@nx-boilerplate/shared-dtos';
import { ICitaMedica } from '@nx-boilerplate/api-interfaces';
import { ClinicalRecordsDomainService } from '@nx-boilerplate/backend/patients-domain';

@Controller()
export class ClinicalRecordsMessageController {
  private readonly logger = new Logger(ClinicalRecordsMessageController.name);

  constructor(
    private readonly clinicalRecordsDomainService: ClinicalRecordsDomainService
  ) {}

  /**
   * Listener asíncrono para el evento de cita confirmada.
   * Crea un borrador clínico con idempotencia en 'historialMedico' para que el médico lo diligencie.
   */
  @EventPattern('appointment.confirmed')
  async handleAppointmentConfirmed(
    @Payload() payload: AppointmentConfirmedEventDto
  ): Promise<void> {
    this.logger.log(
      `Evento recibido: Cita confirmada ${payload.appointmentId} para paciente ${payload.patientNationalId}`
    );
    await this.clinicalRecordsDomainService.initializeDraftFromConfirmedAppointment(payload);
  }

  @MessagePattern('clinical-records.find-by-patient')
  async findByPatient(
    @Payload() payload: FindPatientByNationalIdDto
  ): Promise<ICitaMedica[]> {
    return this.clinicalRecordsDomainService.getPatientClinicalHistory(payload.nationalId);
  }

  @MessagePattern('clinical-records.find-by-id')
  async findById(
    @Payload() payload: FindClinicalRecordByIdDto
  ): Promise<ICitaMedica> {
    return this.clinicalRecordsDomainService.getClinicalRecordById(payload.id);
  }

  @MessagePattern('clinical-records.create')
  async create(
    @Payload() payload: CreateClinicalRecordDto
  ): Promise<ICitaMedica> {
    return this.clinicalRecordsDomainService.createClinicalRecord(payload);
  }

  @MessagePattern('clinical-records.update')
  async update(
    @Payload() payload: UpdateClinicalRecordMessageDto
  ): Promise<ICitaMedica> {
    return this.clinicalRecordsDomainService.updateClinicalRecord(payload.id, payload.data);
  }
}

