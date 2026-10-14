import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { IWorkSchedule } from '@nx-boilerplate/api-interfaces';

export type ProfessionalScheduleDocument = HydratedDocument<ProfessionalScheduleReadModel>;

@Schema({ collection: 'profesionalesActivos', timestamps: false })
export class ProfessionalScheduleReadModel {
  @Prop({ required: true })
  cedula!: string;

  @Prop({ required: true })
  email!: string;

  @Prop({
    type: {
      diasLaborales: { type: [String], required: true },
      horaInicio: { type: String, required: true },
      horaFin: { type: String, required: true },
      recesoAlmuerzo: {
        type: {
          inicio: { type: String },
          fin: { type: String },
        },
        _id: false,
      },
    },
    _id: false,
    required: true,
  })
  horarioTrabajo!: IWorkSchedule;
}

export const ProfessionalScheduleSchema =
  SchemaFactory.createForClass(ProfessionalScheduleReadModel);
