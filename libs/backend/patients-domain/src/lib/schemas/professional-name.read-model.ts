import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ProfessionalNameDocument = HydratedDocument<ProfessionalNameReadModel>;

/**
 * Read-model de solo lectura sobre 'profesionalesActivos' para resolver el nombre
 * completo del médico tratante a partir de su cédula profesional.
 */
@Schema({ collection: 'profesionalesActivos', timestamps: false })
export class ProfessionalNameReadModel {
  @Prop({ required: true })
  cedula!: string;

  @Prop({ required: true })
  nombres!: string;

  @Prop({ required: true })
  apellidos!: string;
}

export const ProfessionalNameSchema = SchemaFactory.createForClass(ProfessionalNameReadModel);

