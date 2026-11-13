import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { IMedicalCategory } from '@nx-boilerplate/api-interfaces';

export type CategoryDocument = HydratedDocument<Category>;

@Schema({ collection: 'categoriaMedica', timestamps: true })
export class Category implements IMedicalCategory {
  @Prop({ required: true, unique: true, index: true })
  categoryId!: string;

  @Prop({ required: true })
  name!: string;

  @Prop({ required: true, unique: true, index: true })
  slug!: string;

  @Prop({ type: String })
  description?: string;

  @Prop({ type: Boolean, default: true, index: true })
  isActive!: boolean;
}

export const CategorySchema = SchemaFactory.createForClass(Category);

