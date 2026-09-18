import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { IPatientHistory } from '@nx-boilerplate/api-interfaces';
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
}
