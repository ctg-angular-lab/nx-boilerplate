import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IPatientHistory } from '@nx-boilerplate/api-interfaces';
import { Patient, PatientDocument } from '../schemas/patient.schema';

@Injectable()
export class PatientsRepository implements OnModuleInit {
  private readonly logger = new Logger(PatientsRepository.name);

  constructor(
    @InjectModel(Patient.name)
    private readonly patientModel: Model<PatientDocument>
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seedInitialPatientsIfEmpty();
  }

  /**
   * Auto-seeder idempotente: si la colección 'patients' está vacía,
   * inserta los pacientes de prueba por defecto.
   */
  async seedInitialPatientsIfEmpty(): Promise<void> {
    try {
      const count = await this.patientModel.countDocuments().exec();
      if (count === 0) {
        this.logger.log(
          'Colección "patients" vacía en MongoDB Atlas. Ejecutando auto-seeder...'
        );

        const initialPatients: IPatientHistory[] = [
          {
            cedula: '1020304050',
            nombreCompleto: 'Laura Sofía Gómez',
            ultimosProcedimientos: [
              {
                id: 'proc-101',
                nombre: 'Profilaxis y Valoración Periodontal',
                fecha: '2026-02-14',
                profesional: 'Dra. María Gómez',
              },
              {
                id: 'proc-102',
                nombre: 'Radiografía Panorámica',
                fecha: '2025-10-05',
                profesional: 'Dr. Carlos Mendoza',
              },
            ],
            recomendaciones:
              'Paciente en control preventivo. Próxima profilaxis sugerida en 6 meses.',
          },
          {
            cedula: '12345678',
            nombreCompleto: 'Juan Pérez',
            ultimosProcedimientos: [
              {
                id: 'proc-201',
                nombre: 'Limpieza Dental Profunda',
                fecha: '2026-01-15',
                profesional: 'Dra. María Gómez',
              },
              {
                id: 'proc-202',
                nombre: 'Extracción Tercer Molar',
                fecha: '2025-11-20',
                profesional: 'Dr. Carlos Mendoza',
              },
            ],
            recomendaciones:
              'Paciente con sensibilidad dental leve. Requiere profilaxis cada 6 meses y control radiográfico anual.',
          },
        ];

        await this.patientModel.insertMany(initialPatients);
        this.logger.log('Auto-seeder completado: 2 pacientes insertados en Atlas.');
      }
    } catch (error) {
      this.logger.warn(
        `Aviso en auto-seeder MongoDB (posible arranque sin conexión): ${(error as Error).message}`
      );
    }
  }

  /**
   * Consulta el paciente por cédula devolviendo un POJO limpio (lean).
   */
  async findByCedula(cedula: string): Promise<IPatientHistory | null> {
    return this.patientModel
      .findOne({ cedula })
      .select('-_id -__v -createdAt -updatedAt')
      .lean<IPatientHistory>()
      .exec();
  }
}
