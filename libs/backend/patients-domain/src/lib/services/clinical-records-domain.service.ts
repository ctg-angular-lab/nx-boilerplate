import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import {
  IAppointmentConfirmedEvent,
  ICitaMedica,
  ICreateClinicalRecordRequest,
  IUpdateClinicalRecordRequest,
} from '@nx-boilerplate/api-interfaces';
import { ClinicalRecordsRepository } from '../repositories/clinical-records.repository';

@Injectable()
export class ClinicalRecordsDomainService {
  constructor(
    private readonly clinicalRecordsRepository: ClinicalRecordsRepository
  ) {}

  async initializeDraftFromConfirmedAppointment(
    event: IAppointmentConfirmedEvent
  ): Promise<ICitaMedica> {
    return this.clinicalRecordsRepository.createDraftFromAppointment(event);
  }

  async getPatientClinicalHistory(cedula: string): Promise<ICitaMedica[]> {
    return this.clinicalRecordsRepository.findByPatientCedula(cedula);
  }

  async getClinicalRecordById(id: string): Promise<ICitaMedica> {
    const record = await this.clinicalRecordsRepository.findById(id);
    if (!record) {
      throw new RpcException({
        status: 'error',
        code: 404,
        message: `Atención clínica con identificador ${id} no encontrada`,
        timestamp: new Date().toISOString(),
      });
    }
    return record;
  }

  async createClinicalRecord(
    data: ICreateClinicalRecordRequest
  ): Promise<ICitaMedica> {
    return this.clinicalRecordsRepository.create(data);
  }

  async updateClinicalRecord(
    id: string,
    data: IUpdateClinicalRecordRequest
  ): Promise<ICitaMedica> {
    const updated = await this.clinicalRecordsRepository.update(id, data);
    if (!updated) {
      throw new RpcException({
        status: 'error',
        code: 404,
        message: `Atención clínica con identificador ${id} no encontrada para actualizar`,
        timestamp: new Date().toISOString(),
      });
    }
    return updated;
  }
}

