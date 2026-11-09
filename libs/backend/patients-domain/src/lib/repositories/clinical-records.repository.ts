import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  IAppointmentConfirmedEvent,
  ICitaMedica,
  ICreateClinicalRecordRequest,
  IUpdateClinicalRecordRequest,
} from '@nx-boilerplate/api-interfaces';
import { REGEX_MONGO_OBJECT_ID } from '@nx-boilerplate/utils';
import {
  ClinicalRecord,
  ClinicalRecordDocument,
} from '../schemas/clinical-record.schema';

@Injectable()
export class ClinicalRecordsRepository {
  private readonly logger = new Logger(ClinicalRecordsRepository.name);

  constructor(
    @InjectModel(ClinicalRecord.name)
    private readonly clinicalRecordModel: Model<ClinicalRecordDocument>
  ) {}

  /**
   * Crea un borrador clínico de forma atómica e idempotente cuando se confirma una cita en el agendador.
   */
  async createDraftFromAppointment(
    event: IAppointmentConfirmedEvent
  ): Promise<ICitaMedica> {
    const draftData: Partial<ClinicalRecord> = {
      appointmentId: event.appointmentId,
      cedula_paciente: event.patientNationalId,
      estado_registro: 'PENDIENTE_ATENCION',
      medico_tratante: [
        {
          cedula_profesional: event.doctorCedula,
          fecha_atencion: new Date(event.appointmentDate),
        },
      ],
      registro_clinico: {
        motivo_consulta: `Atención programada para: ${event.procedureName}`,
        enfermedad_actual: '',
        antecedentes_medicos: {
          patologicos: 'Niega',
          alergicos: 'Niega',
          farmacologicos: 'Niega',
          procedimientos_previos: 'Niega',
        },
        examen_fisico: '',
        ultimosProcedimientos: [event.procedureName],
        procedimiento_realizado: event.procedureName,
        lote_producto: null,
        recomendaciones: '',
      },
      soporte_documental: {
        consentimiento_informado: false,
        descargable_consentimiento: '',
      },
    };

    const doc = await this.clinicalRecordModel
      .findOneAndUpdate(
        { appointmentId: event.appointmentId },
        { $setOnInsert: draftData },
        { upsert: true, new: true }
      )
      .select('-__v')
      .lean<any>()
      .exec();

    this.logger.log(
      `Borrador clínico asegurado (idempotente) para cita: ${event.appointmentId}`
    );

    return {
      ...doc,
      _id: String(doc._id),
    };
  }

  async findByPatientCedula(cedula_paciente: string): Promise<ICitaMedica[]> {
    const docs = await this.clinicalRecordModel
      .find({ cedula_paciente })
      .sort({ createdAt: -1 })
      .select('-__v')
      .lean<any[]>()
      .exec();

    return docs.map((doc) => ({
      ...doc,
      _id: String(doc._id),
    }));
  }

  async findById(id: string): Promise<ICitaMedica | null> {
    const query = id.match(REGEX_MONGO_OBJECT_ID)
      ? { $or: [{ _id: id }, { appointmentId: id }] }
      : { appointmentId: id };

    const doc = await this.clinicalRecordModel
      .findOne(query)
      .select('-__v')
      .lean<any>()
      .exec();

    if (!doc) return null;
    return {
      ...doc,
      _id: String(doc._id),
    };
  }

  async create(data: ICreateClinicalRecordRequest): Promise<ICitaMedica> {
    const created = new this.clinicalRecordModel({
      appointmentId: data.appointmentId ?? null,
      cedula_paciente: data.cedula_paciente,
      estado_registro: data.estado_registro ?? 'PENDIENTE_ATENCION',
      medico_tratante: data.medico_tratante,
      registro_clinico: data.registro_clinico,
      soporte_documental: data.soporte_documental ?? {
        consentimiento_informado: false,
        descargable_consentimiento: '',
      },
    });

    const saved = await created.save();
    const obj = saved.toObject();
    return {
      ...obj,
      _id: String(obj._id),
    };
  }

  async update(
    id: string,
    data: IUpdateClinicalRecordRequest
  ): Promise<ICitaMedica | null> {
    const query = id.match(REGEX_MONGO_OBJECT_ID)
      ? { $or: [{ _id: id }, { appointmentId: id }] }
      : { appointmentId: id };

    const updateFields: Record<string, any> = {};
    if (data.estado_registro) {
      updateFields['estado_registro'] = data.estado_registro;
    }
    if (data.medico_tratante) {
      updateFields['medico_tratante'] = data.medico_tratante;
    }
    if (data.registro_clinico) {
      Object.entries(data.registro_clinico).forEach(([key, value]) => {
        if (value !== undefined) {
          updateFields[`registro_clinico.${key}`] = value;
        }
      });
    }
    if (data.soporte_documental) {
      Object.entries(data.soporte_documental).forEach(([key, value]) => {
        if (value !== undefined) {
          updateFields[`soporte_documental.${key}`] = value;
        }
      });
    }

    const updated = await this.clinicalRecordModel
      .findOneAndUpdate(query, { $set: updateFields }, { new: true })
      .select('-__v')
      .lean<any>()
      .exec();

    if (!updated) return null;
    return {
      ...updated,
      _id: String(updated._id),
    };
  }
}

