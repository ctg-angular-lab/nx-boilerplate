import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Appointment,
  AppointmentDocument,
  AppointmentStatus,
} from '../schemas/appointment.schema';

@Injectable()
export class AppointmentRepository {
  constructor(
    @InjectModel(Appointment.name)
    private readonly appointmentModel: Model<AppointmentDocument>
  ) {}

  async create(appointmentData: Partial<Appointment>): Promise<Appointment> {
    const created = new this.appointmentModel(appointmentData);
    return created.save();
  }

  async findByDoctorAndDateRange(
    doctorEmail: string,
    startOfDay: Date,
    endOfDay: Date
  ): Promise<Appointment[]> {
    return this.appointmentModel
      .find({
        doctorEmail,
        status: { $ne: AppointmentStatus.CANCELLED },
        startTime: { $gte: startOfDay, $lte: endOfDay },
      })
      .select('-_id -__v')
      .lean<Appointment[]>()
      .exec();
  }

  async findById(appointmentId: string): Promise<Appointment | null> {
    return this.appointmentModel
      .findOne({ appointmentId })
      .select('-_id -__v')
      .lean<Appointment>()
      .exec();
  }

  async findByPatientNationalId(patientNationalId: string): Promise<Appointment[]> {
    return this.appointmentModel
      .find({ patientNationalId })
      .select('-_id -__v')
      .lean<Appointment[]>()
      .exec();
  }
}
