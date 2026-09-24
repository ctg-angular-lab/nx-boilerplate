import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { IProcedure, IProfessionalSummary } from '@nx-boilerplate/api-interfaces';
import { ProceduresRepository } from '../repositories/procedures.repository';

@Injectable()
export class ProceduresDomainService {
  constructor(private readonly proceduresRepository: ProceduresRepository) {}

  async getAll(): Promise<IProcedure[]> {
    return this.proceduresRepository.findAll();
  }

  async getById(idProcedimiento: string): Promise<IProcedure> {
    const procedure = await this.proceduresRepository.findById(idProcedimiento);

    if (!procedure) {
      throw new RpcException({
        status: 'error',
        code: 404,
        message: 'Procedimiento médico no encontrado',
        timestamp: new Date().toISOString(),
      });
    }

    return procedure;
  }

  async getByDoctor(doctorCedula: string): Promise<IProcedure[]> {
    return this.proceduresRepository.findByDoctor(doctorCedula);
  }

  async getDoctorsByProcedureId(
    idProcedimiento: string
  ): Promise<IProfessionalSummary[]> {
    const procedure = await this.getById(idProcedimiento);

    if (
      !procedure.medicosRelacionados ||
      procedure.medicosRelacionados.length === 0
    ) {
      return [];
    }

    const doctors = await this.proceduresRepository.findDoctorsByCedulas(
      procedure.medicosRelacionados
    );

    return doctors.map((doc) => ({
      cedula: doc.cedula,
      nombres: doc.nombres,
      apellidos: doc.apellidos,
      email: doc.email,
      profesion: doc.profesion,
      horarioTrabajo: doc.horarioTrabajo,
    }));
  }
}

