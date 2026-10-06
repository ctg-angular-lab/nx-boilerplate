import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { IAreaCode } from '@nx-boilerplate/api-interfaces';

export type AreaCodeDocument = HydratedDocument<AreaCode>;

@Schema({ collection: 'codigosArea', timestamps: true })
export class AreaCode implements IAreaCode {
  @Prop({ required: true })
  code!: string;

  @Prop({ required: true })
  country!: string;

  @Prop({ required: true })
  flag!: string;

  @Prop({ required: true })
  pattern!: string;

  @Prop({ required: true })
  errorMessage!: string;
}

export const AreaCodeSchema = SchemaFactory.createForClass(AreaCode);
