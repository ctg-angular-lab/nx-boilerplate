import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import {
  IActiveProfessional,
  IExceptionSchedule,
  ISpecialtyCategoryRef,
  IWorkSchedule,
} from '@nx-boilerplate/api-interfaces';

export type ActiveProfessionalDocument = HydratedDocument<ActiveProfessional>;

@Schema({ _id: false })
export class ProfessionalSpecialtyCategory implements ISpecialtyCategoryRef {
  @Prop({ required: true })
  categoryId!: string;

  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  slug!: string;
}
export const ProfessionalSpecialtyCategorySchema =
  SchemaFactory.createForClass(ProfessionalSpecialtyCategory);

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

  @Prop({ type: ProfessionalSpecialtyCategorySchema, default: null })
  specialtyCategory?: ProfessionalSpecialtyCategory;

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

  @Prop({ type: Boolean, default: true, index: true })
  isActive!: boolean;

  @Prop({
    type: [
      {
        fecha: { type: String, required: true },
        horaInicio: { type: String, required: true },
        horaFin: { type: String, required: true },
        tipo: { type: String, required: true, enum: ['EXTRA_SHIFT', 'DAY_OFF'] },
      },
    ],
    default: [],
    _id: false,
  })
  horariosExcepcionales!: IExceptionSchedule[];
}

export const ActiveProfessionalSchema = SchemaFactory.createForClass(ActiveProfessional);

ActiveProfessionalSchema.index({ 'specialtyCategory.slug': 1 });
