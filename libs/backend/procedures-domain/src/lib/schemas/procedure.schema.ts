import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { IProcedure } from '@nx-boilerplate/api-interfaces';

export type ProcedureDocument = HydratedDocument<Procedure>;

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
}

export const ProcedureSchema = SchemaFactory.createForClass(Procedure);
