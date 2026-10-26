import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { IProcedure, IProcedureLaboratory } from '@nx-boilerplate/api-interfaces';

export type ProcedureDocument = HydratedDocument<Procedure>;

@Schema({ _id: false })
export class ProcedureLaboratory implements IProcedureLaboratory {
  @Prop({ required: true })
  nombreLaboratorio!: string;

  @Prop({ required: true, min: 0 })
  precio!: number;

  @Prop({ required: true })
  medidaPorUnidad!: string;
}

export const ProcedureLaboratorySchema =
  SchemaFactory.createForClass(ProcedureLaboratory);

@Schema({ collection: 'procedimientosMedicos', timestamps: true })
export class Procedure implements IProcedure {
  @Prop({ required: true, unique: true, index: true })
  idProcedimiento!: string;

  @Prop({ required: true })
  nombreProcedimiento!: string;

  @Prop({ required: true })
  valorStandar!: number;

  @Prop({ required: true })
  duracionStandar!: number;

  @Prop({ type: [String], default: [], index: true })
  medicosRelacionados!: string[];

  @Prop({ type: Boolean, default: true, index: true })
  isActive?: boolean;

  @Prop({ type: [ProcedureLaboratorySchema], default: [] })
  laboratorios?: ProcedureLaboratory[];
}

export const ProcedureSchema = SchemaFactory.createForClass(Procedure);
