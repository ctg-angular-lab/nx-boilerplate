import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AppointmentDocument = HydratedDocument<Appointment>;

export enum AppointmentStatus {
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

  @Prop({ required: true })
  procedureId!: string;

  @Prop({ required: true })
  procedureName!: string;

  @Prop({ required: true })
  startTime!: Date;

  @Prop({ required: true })
  endTime!: Date;

  @Prop({
    type: String,
    required: true,
    enum: Object.values(AppointmentStatus),
    default: AppointmentStatus.CONFIRMED,
  })
  status!: AppointmentStatus;

  @Prop()
  googleCalendarEventId?: string;

  @Prop()
  notes?: string;
}

export const AppointmentSchema = SchemaFactory.createForClass(Appointment);
