import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AppointmentDocument = HydratedDocument<Appointment>;

export enum AppointmentStatus {
  AVAILABLE = 'AVAILABLE',
  TENTATIVE = 'TENTATIVE',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

@Schema({ collection: 'appointments', timestamps: true })
export class Appointment {
  @Prop({ required: true, unique: true, index: true })
  appointmentId!: string;

  @Prop({ required: true, index: true })
  doctorEmail!: string;

  @Prop({ required: true })
  doctorCedula!: string;

  @Prop({ required: true, index: true })
  patientNationalId!: string;

  @Prop({ required: true })
  patientFullName!: string;

  @Prop({ required: true })
  patientEmail!: string;

  @Prop()
  patientPhone?: string;

  @Prop({ required: true })
  procedureId!: string;

  @Prop({ required: true })
  procedureName!: string;

  @Prop({ required: true })
  startTime!: Date;

  @Prop({ required: true })
  endTime!: Date;

  @Prop({
    required: true,
    enum: ['AVAILABLE', 'TENTATIVE', 'CONFIRMED', 'CANCELLED', 'COMPLETED'],
    default: 'TENTATIVE',
    index: true,
  })
  status!: string;

  @Prop({
    required: true,
    enum: ['needsAction', 'accepted', 'declined', 'tentative'],
    default: 'needsAction',
  })
  patientResponseStatus!: string;

  @Prop({ default: '5' })
  colorId!: string;

  @Prop()
  googleCalendarEventId?: string;

  @Prop()
  notes?: string;
}

export const AppointmentSchema = SchemaFactory.createForClass(Appointment);
