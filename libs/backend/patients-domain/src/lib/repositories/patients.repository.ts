import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ICreatePatientRequest,
  IPatientHistory,
  IUpdatePatientRequest,
} from '@nx-boilerplate/api-interfaces';
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
            nombre: 'Laura Sofía',
            apellidos: 'Gómez',
            correo: 'laura.gomez@example.com',
            celular: '3001234567',
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
            nombre: 'Juan',
            apellidos: 'Pérez',
            correo: 'juan.perez@example.com',
            celular: '3109876543',
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
   * Consulta todos los pacientes registrados en la colección 'patients'.
   */
  async findAll(): Promise<IPatientHistory[]> {
    const docs = await this.patientModel
      .find()
      .sort({ createdAt: -1 })
      .select('-__v')
      .lean<any[]>()
      .exec();

    return docs.map((doc) => ({
      ...doc,
      _id: doc._id ? String(doc._id) : undefined,
    }));
  }

  /**
   * Actualiza los datos demográficos de un paciente por su cédula.
   */
  async updateByCedula(
    cedula: string,
    data: IUpdatePatientRequest
  ): Promise<IPatientHistory | null> {
    const updated = await this.patientModel
      .findOneAndUpdate(
        { cedula },
        { $set: data },
        { new: true }
      )
      .select('-__v')
      .lean<any>()
      .exec();

    if (!updated) return null;
    return {
      ...updated,
      _id: updated._id ? String(updated._id) : undefined,
    };
  }

  /**
   * Consulta el paciente por cédula devolviendo un POJO limpio (lean).
   */
  async findByCedula(cedula: string): Promise<IPatientHistory | null> {
    const doc = await this.patientModel
      .findOne({ cedula })
      .select('-__v')
      .lean<any>()
      .exec();

    if (!doc) return null;
    return {
      ...doc,
      _id: doc._id ? String(doc._id) : undefined,
    };
  }

  /**
   * Registra un nuevo paciente en la colección 'patients' de MongoDB Atlas.
   */
  async create(patientData: ICreatePatientRequest): Promise<IPatientHistory> {
    const createdPatient = new this.patientModel({
      cedula: patientData.cedula,
      tipo_documento: patientData.tipo_documento ?? 'CC',
      nombre: patientData.nombre,
      apellidos: patientData.apellidos,
      correo: patientData.correo,
      celular: patientData.celular,
      fecha_nacimiento: patientData.fecha_nacimiento ?? null,
      edad: patientData.edad ?? null,
      sexo: patientData.sexo ?? null,
      estado_civil: patientData.estado_civil ?? null,
      ocupacion: patientData.ocupacion ?? null,
      direccion_residencia: patientData.direccion_residencia ?? null,
      aseguradora: patientData.aseguradora ?? null,
      tipo_vinculacion: patientData.tipo_vinculacion ?? null,
      es_menor_de_edad: patientData.es_menor_de_edad ?? false,
      acompanante: patientData.acompanante ?? { nombre: null, telefono: null },
      persona_responsable: patientData.persona_responsable ?? {
        nombre: null,
        telefono: null,
        parentesco: null,
      },
      ...(patientData.ultimosProcedimientos
        ? { ultimosProcedimientos: patientData.ultimosProcedimientos }
        : {}),
      ...(patientData.recomendaciones !== undefined
        ? { recomendaciones: patientData.recomendaciones }
        : {}),
    });
    const saved = await createdPatient.save();
    const obj = saved.toObject();
    return {
      _id: String(obj._id),
      cedula: obj.cedula,
      tipo_documento: obj.tipo_documento ?? 'CC',
      nombre: obj.nombre,
      apellidos: obj.apellidos,
      correo: obj.correo,
      celular: obj.celular,
      fecha_nacimiento: obj.fecha_nacimiento ?? null,
      edad: obj.edad ?? null,
      sexo: obj.sexo ?? null,
      estado_civil: obj.estado_civil ?? null,
      ocupacion: obj.ocupacion ?? null,
      direccion_residencia: obj.direccion_residencia ?? null,
      aseguradora: obj.aseguradora ?? null,
      tipo_vinculacion: obj.tipo_vinculacion ?? null,
      es_menor_de_edad: obj.es_menor_de_edad ?? false,
      acompanante: obj.acompanante ?? { nombre: null, telefono: null },
      persona_responsable: obj.persona_responsable ?? {
        nombre: null,
        telefono: null,
        parentesco: null,
      },
      ...(obj.ultimosProcedimientos ? { ultimosProcedimientos: obj.ultimosProcedimientos } : {}),
      ...(obj.recomendaciones !== undefined ? { recomendaciones: obj.recomendaciones } : {}),
      createdAt: (obj as unknown as { createdAt?: Date }).createdAt,
      updatedAt: (obj as unknown as { updatedAt?: Date }).updatedAt,
    };
  }
}

