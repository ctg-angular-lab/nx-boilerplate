import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import {
  ClinicalRecordStatus,
  IAntecedentesMedicos,
  IMedicoTratante,
  IRegistroClinico,
  ISoporteDocumental,
} from '@nx-boilerplate/api-interfaces';

export type ClinicalRecordDocument = HydratedDocument<ClinicalRecord>;

@Schema({ _id: false })
export class MedicoTratante implements IMedicoTratante {
  @Prop({ required: true })
  cedula_profesional!: string;

  @Prop({ type: String, default: null })
  nombre_profesional?: string;

  @Prop({ required: true, type: Date })
  fecha_atencion!: Date | string;
}
export const MedicoTratanteSchema = SchemaFactory.createForClass(MedicoTratante);

@Schema({ _id: false })
export class AntecedentesMedicos implements IAntecedentesMedicos {
  @Prop({ default: 'Niega' })
  patologicos!: string;

  @Prop({ default: 'Niega' })
  alergicos!: string;

  @Prop({ default: 'Niega' })
  farmacologicos!: string;

  @Prop({ default: 'Niega' })
  procedimientos_previos!: string;
}
export const AntecedentesMedicosSchema = SchemaFactory.createForClass(AntecedentesMedicos);

@Schema({ _id: false })
export class RegistroClinico implements IRegistroClinico {
  @Prop({ required: true })
  motivo_consulta!: string;

  @Prop({ default: '' })
  enfermedad_actual!: string;

  @Prop({ type: AntecedentesMedicosSchema, default: () => ({}) })
  antecedentes_medicos!: AntecedentesMedicos;

  @Prop({ default: '' })
  examen_fisico!: string;

  @Prop({ type: [String], default: [] })
  ultimosProcedimientos?: string[];

  @Prop({ default: '' })
  procedimiento_realizado!: string;

  @Prop({ type: String, default: null })
  lote_producto!: string | null;

  @Prop({ default: '' })
  recomendaciones!: string;
}
export const RegistroClinicoSchema = SchemaFactory.createForClass(RegistroClinico);

@Schema({ _id: false })
export class SoporteDocumental implements ISoporteDocumental {
  @Prop({ default: false })
  consentimiento_informado!: boolean;

  @Prop({ default: '' })
  descargable_consentimiento!: string;
}
export const SoporteDocumentalSchema = SchemaFactory.createForClass(SoporteDocumental);

@Schema({ collection: 'historialMedico', timestamps: true })
export class ClinicalRecord {
  @Prop({ type: String, unique: true, sparse: true, index: true, default: null })
  appointmentId?: string | null;

  @Prop({ required: true, index: true })
  cedula_paciente!: string;

  @Prop({
    type: String,
    required: true,
    enum: ['PENDIENTE_ATENCION', 'COMPLETADA'],
    default: 'PENDIENTE_ATENCION',
    index: true,
  })
  estado_registro!: ClinicalRecordStatus;

  @Prop({ type: [MedicoTratanteSchema], default: [] })
  medico_tratante!: MedicoTratante[];

  @Prop({ type: RegistroClinicoSchema, required: true })
  registro_clinico!: RegistroClinico;

  @Prop({
    type: SoporteDocumentalSchema,
    default: () => ({ consentimiento_informado: false, descargable_consentimiento: '' }),
  })
  soporte_documental!: SoporteDocumental;
}

export const ClinicalRecordSchema = SchemaFactory.createForClass(ClinicalRecord);
