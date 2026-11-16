import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ProfessionalNameDocument,
  ProfessionalNameReadModel,
} from '../schemas/professional-name.read-model';

@Injectable()
export class ProfessionalNamesRepository {
  private readonly logger = new Logger(ProfessionalNamesRepository.name);

  constructor(
    @InjectModel(ProfessionalNameReadModel.name)
    private readonly model: Model<ProfessionalNameDocument>
  ) {}

  /**
   * Resuelve "<nombres> <apellidos>" del profesional por cédula.
   * Retorna null si no existe o si ocurre un error de consulta (no bloquea el flujo clínico).
   */
  async findFullNameByCedula(cedula: string): Promise<string | null> {
    if (!cedula) return null;

    try {
      const doc = await this.model
        .findOne({ cedula })
        .select('nombres apellidos')
        .lean()
        .exec();
      if (!doc) return null;

      const fullName = `${doc.nombres ?? ''} ${doc.apellidos ?? ''}`.trim();
      return fullName || null;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`No se pudo resolver el nombre del profesional ${cedula}: ${msg}`);
      return null;
    }
  }
}

