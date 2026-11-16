import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import {
  ICitaMedica,
  ICreatePatientRequest,
  IPatientHistory,
  IUpdatePatientRequest,
} from '@nx-boilerplate/api-interfaces';
import { PatientsRepository } from '../repositories/patients.repository';
import { ClinicalRecordsRepository } from '../repositories/clinical-records.repository';
import { ProfessionalNamesRepository } from '../repositories/professional-names.repository';

@Injectable()
export class PatientsDomainService {
  constructor(
    private readonly patientsRepository: PatientsRepository,
    private readonly clinicalRecordsRepository: ClinicalRecordsRepository,
    private readonly professionalNamesRepository: ProfessionalNamesRepository
  ) {}

  async findAllPatients(): Promise<IPatientHistory[]> {
    return this.patientsRepository.findAll();
  }

  /**
   * Busca el paciente por cédula e hidrata automáticamente su último médico tratante
   * y recomendaciones a partir de la historia médica COMPLETADA más reciente
   * (colección 'historialMedico') para el Paso 2 del agendador.
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

    const records = clinicalRecords ?? [];
    const latestCompleted = this.findLatestCompletedRecord(records);

    const procedimientos = records
      .map((rec) => ({
        id: rec.appointmentId || rec._id || '',
        nombre: rec.registro_clinico?.procedimiento_realizado || '',
        fecha: rec.medico_tratante?.[0]?.fecha_atencion
          ? new Date(rec.medico_tratante[0].fecha_atencion).toISOString().slice(0, 10)
          : '',
        profesional:
          rec.medico_tratante?.[0]?.nombre_profesional ||
          rec.medico_tratante?.[0]?.cedula_profesional ||
          '',
      }))
      .filter((p) => p.nombre);

    const medico = latestCompleted?.medico_tratante?.[0];
    let nombreMedico = medico?.nombre_profesional || undefined;
    if (!nombreMedico && medico?.cedula_profesional) {
      nombreMedico =
        (await this.professionalNamesRepository.findFullNameByCedula(
          medico.cedula_profesional
        )) ?? undefined;
    }
    const ultimoMedicoTratante = nombreMedico || medico?.cedula_profesional || undefined;
    const recomendaciones = latestCompleted?.registro_clinico?.recomendaciones || undefined;

    return {
      ...patient,
      ultimosProcedimientos:
        procedimientos.length > 0 ? procedimientos : patient.ultimosProcedimientos,
      recomendaciones,
      ultimoMedicoTratante,
      ultimoMedicoTratanteCedula: medico?.cedula_profesional || undefined,
    };
  }

  /**
   * Retorna la historia médica con estado_registro 'COMPLETADA' más reciente,
   * ordenada por fecha de atención del médico tratante y createdAt como desempate.
   */
  private findLatestCompletedRecord(records: ICitaMedica[]): ICitaMedica | undefined {
    const toTime = (value: unknown): number => {
      if (!value) return 0;
      const raw =
        typeof value === 'object' && value !== null && '$date' in value
          ? (value as { $date: string }).$date
          : (value as string | Date);
      const time = new Date(raw).getTime();
      return Number.isNaN(time) ? 0 : time;
    };

    return records
      .filter((rec) => rec.estado_registro === 'COMPLETADA')
      .sort((a, b) => {
        const byAttention =
          toTime(b.medico_tratante?.[0]?.fecha_atencion) -
          toTime(a.medico_tratante?.[0]?.fecha_atencion);
        return byAttention !== 0 ? byAttention : toTime(b.createdAt) - toTime(a.createdAt);
      })[0];
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
