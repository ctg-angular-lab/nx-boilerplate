import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { ICreatePatientRequest, IPatientHistory } from '@nx-boilerplate/api-interfaces';
import { PatientsRepository } from '../repositories/patients.repository';

@Injectable()
export class PatientsDomainService {
  constructor(private readonly patientsRepository: PatientsRepository) {}

  /**
   * Busca el historial de un paciente consultando MongoDB mediante el repositorio.
   * Lanza RpcException 404 si el paciente no existe.
   */
  async findByNationalId(nationalId: string): Promise<IPatientHistory> {
    const patient = await this.patientsRepository.findByCedula(nationalId);

    if (!patient) {
      throw new RpcException({
        status: 'error',
        code: 404,
        message: 'Paciente no encontrado con el documento proporcionado',
        timestamp: new Date().toISOString(),
      });
    }

    return patient;
  }

  /**
   * Registra un nuevo paciente en el sistema validando unicidad de cédula.
   * Lanza RpcException 409 si el paciente ya existe.
   */
  async createPatient(data: ICreatePatientRequest): Promise<IPatientHistory> {
    const existing = await this.patientsRepository.findByCedula(data.cedula);
    if (existing) {
      throw new RpcException({
        status: 'error',
        code: 409,
        message: `El paciente con cédula ${data.cedula} ya se encuentra registrado`,
        timestamp: new Date().toISOString(),
      });
    }

    return this.patientsRepository.create(data);
  }
}

