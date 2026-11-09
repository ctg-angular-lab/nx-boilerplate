import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import {
  IPatientCompanion,
  IPatientResponsible,
  IProcedureItem,
} from '@nx-boilerplate/api-interfaces';

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

@Schema({ _id: false })
export class PatientCompanion implements IPatientCompanion {
  @Prop({ type: String, default: null })
  nombre!: string | null;

  @Prop({ type: String, default: null })
  telefono!: string | null;
}

export const PatientCompanionSchema = SchemaFactory.createForClass(PatientCompanion);

@Schema({ _id: false })
export class PatientResponsible implements IPatientResponsible {
  @Prop({ type: String, default: null })
  nombre!: string | null;

  @Prop({ type: String, default: null })
  telefono!: string | null;

  @Prop({ type: String, default: null })
  parentesco!: string | null;
}

export const PatientResponsibleSchema = SchemaFactory.createForClass(PatientResponsible);

@Schema({ collection: 'patients', timestamps: true })
export class Patient {
  @Prop({ required: true, unique: true, index: true })
  cedula!: string;

  @Prop({ type: String, default: 'CC' })
  tipo_documento!: string | null;

  @Prop({ required: true })
  nombre!: string;

  @Prop({ required: true })
  apellidos!: string;

  @Prop({ required: true })
  correo!: string;

  @Prop({ required: true })
  celular!: string;

  @Prop({ type: String, default: null })
  fecha_nacimiento!: string | null;

  @Prop({ type: Number, default: null })
  edad!: number | null;

  @Prop({ type: String, default: null })
  sexo!: string | null;

  @Prop({ type: String, default: null })
  estado_civil!: string | null;

  @Prop({ type: String, default: null })
  ocupacion!: string | null;

  @Prop({ type: String, default: null })
  direccion_residencia!: string | null;

  @Prop({ type: String, default: null })
  aseguradora!: string | null;

  @Prop({ type: String, default: null })
  tipo_vinculacion!: string | null;

  @Prop({ type: Boolean, default: false })
  es_menor_de_edad!: boolean | null;

  @Prop({
    type: PatientCompanionSchema,
    default: () => ({ nombre: null, telefono: null }),
  })
  acompanante!: PatientCompanion;

  @Prop({
    type: PatientResponsibleSchema,
    default: () => ({ nombre: null, telefono: null, parentesco: null }),
  })
  persona_responsable!: PatientResponsible;

  @Prop({ type: [ProcedureItemSchema], default: undefined })
  ultimosProcedimientos?: ProcedureItem[];

  @Prop({ type: String, default: undefined })
  recomendaciones?: string;
}

export const PatientSchema = SchemaFactory.createForClass(Patient);
