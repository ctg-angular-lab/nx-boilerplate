import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import {
  ICreatePatientRequest,
  IPatientHistory,
  IUpdatePatientRequest,
} from '@nx-boilerplate/api-interfaces';
import { PatientsRepository } from '../repositories/patients.repository';
import { ClinicalRecordsRepository } from '../repositories/clinical-records.repository';

@Injectable()
export class PatientsDomainService {
  constructor(
    private readonly patientsRepository: PatientsRepository,
    private readonly clinicalRecordsRepository: ClinicalRecordsRepository
  ) {}

  async findAllPatients(): Promise<IPatientHistory[]> {
    return this.patientsRepository.findAll();
  }

  /**
   * Busca el paciente por cédula e hidrata automáticamente su último procedimiento
   * y recomendaciones a partir de la colección 'historialMedico' para el Paso 2 del agendador.
   */
  async findByNationalId(nationalId: string): Promise<IPatientHistory> {
    const [patient, clinicalRecords] = await Promise.all([
      this.patientsRepository.findByCedula(nationalId),
      this.clinicalRecordsRepository.findByPatientCedula(nationalId),
    ]);

    if (!patient) {
      throw new RpcException({
        status: 'error',
        code: 404,
        message: 'Paciente no encontrado con el documento proporcionado',
        timestamp: new Date().toISOString(),
      });
    }

    // Si existen registros clínicos en 'historialMedico', enriquecemos la respuesta
    if (clinicalRecords && clinicalRecords.length > 0) {
      const latest = clinicalRecords[0];
      const procedimientos = clinicalRecords
        .map((rec) => ({
          id: rec.appointmentId || rec._id || '',
          nombre: rec.registro_clinico?.procedimiento_realizado || '',
          fecha:
            rec.medico_tratante?.[0]?.fecha_atencion
              ? new Date(rec.medico_tratante[0].fecha_atencion).toISOString().slice(0, 10)
              : '',
          profesional:
            rec.medico_tratante?.[0]?.nombre_profesional ||
            rec.medico_tratante?.[0]?.cedula_profesional ||
            '',
        }))
        .filter((p) => p.nombre);

      return {
        ...patient,
        ultimosProcedimientos:
          procedimientos.length > 0 ? procedimientos : patient.ultimosProcedimientos,
        recomendaciones:
          latest.registro_clinico?.recomendaciones || patient.recomendaciones,
      };
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

  /**
   * Actualiza los datos demográficos de un paciente validando su existencia previa.
   * Lanza RpcException 404 si el paciente no existe.
   */
  async updatePatient(
    nationalId: string,
    data: IUpdatePatientRequest
  ): Promise<IPatientHistory> {
    const updated = await this.patientsRepository.updateByCedula(nationalId, data);
    if (!updated) {
      throw new RpcException({
        status: 'error',
        code: 404,
        message: `El paciente con cédula ${nationalId} no existe para ser actualizado`,
        timestamp: new Date().toISOString(),
      });
    }

    return updated;
  }
}
