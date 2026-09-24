import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { IActiveProfessional, IWorkSchedule } from '@nx-boilerplate/api-interfaces';

export type ActiveProfessionalDocument = HydratedDocument<ActiveProfessional>;

@Schema({ collection: 'profesionalesActivos', timestamps: true })
export class ActiveProfessional implements IActiveProfessional {
  @Prop({ required: true, unique: true, index: true })
  cedula!: string;

  @Prop({ required: true })
  nombres!: string;

  @Prop({ required: true })
  apellidos!: string;

  @Prop({ required: true })
  email!: string;

  @Prop({ required: true })
  profesion!: string;

  @Prop({ type: [String], default: [] })
  procedimientosRelacionados!: string[];

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

export const ActiveProfessionalSchema = SchemaFactory.createForClass(ActiveProfessional);
