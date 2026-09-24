import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { IProcedureItem } from '@nx-boilerplate/api-interfaces';

export type PatientDocument = HydratedDocument<Patient>;

@Schema({ _id: false })
export class ProcedureItem implements IProcedureItem {
  @Prop({ required: true })
  id!: string;

  @Prop({ required: true })
  nombre!: string;

  @Prop({ required: true })
  fecha!: string;

  @Prop({ required: true })
  profesional!: string;
}

export const ProcedureItemSchema = SchemaFactory.createForClass(ProcedureItem);

@Schema({ collection: 'patients', timestamps: true })
export class Patient {
  @Prop({ required: true, unique: true, index: true })
  cedula!: string;

  @Prop({ required: true })
  nombreCompleto!: string;

  @Prop({ type: [ProcedureItemSchema], default: [] })
  ultimosProcedimientos!: ProcedureItem[];

  @Prop({ default: '' })
  recomendaciones!: string;
}

export const PatientSchema = SchemaFactory.createForClass(Patient);
