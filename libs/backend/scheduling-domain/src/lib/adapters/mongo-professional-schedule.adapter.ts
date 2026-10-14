import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IWorkSchedule } from '@nx-boilerplate/api-interfaces';
import { escapeRegExp } from '@nx-boilerplate/utils';
import { IProfessionalScheduleProvider } from '../ports/professional-schedule-provider.port';
import {
  ProfessionalScheduleReadModel,
  ProfessionalScheduleDocument,
} from '../schemas/professional-schedule.read-model';

@Injectable()
export class MongoProfessionalScheduleAdapter implements IProfessionalScheduleProvider {
  private readonly logger = new Logger(MongoProfessionalScheduleAdapter.name);

  constructor(
    @InjectModel(ProfessionalScheduleReadModel.name)
    private readonly model: Model<ProfessionalScheduleDocument>
  ) {}

  async getSchedule(doctorEmail?: string, doctorCedula?: string): Promise<IWorkSchedule | null> {
    const conditions: Array<Record<string, unknown>> = [];
    if (doctorCedula) {
      conditions.push({ cedula: doctorCedula });
    }
    if (doctorEmail) {
      conditions.push({
        email: { $regex: new RegExp(`^${escapeRegExp(doctorEmail.trim())}$`, 'i') },
      });
    }

    if (conditions.length === 0) {
      return null;
    }

    try {
      const doc = await this.model.findOne({ $or: conditions }).lean().exec();
      return doc?.horarioTrabajo || null;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Error al consultar horario de especialista en MongoDB: ${errorMsg}`);
      return null;
    }
  }
}
