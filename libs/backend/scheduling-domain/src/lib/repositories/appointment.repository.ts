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
      .findOne({
        $or: [
          { appointmentId },
          ...(appointmentId.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: appointmentId }] : []),
        ],
      })
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

  async findDaily(filter: {
    startOfDay: Date;
    endOfDay: Date;
    doctorEmail?: string;
    status?: string;
  }): Promise<Appointment[]> {
    const query: Record<string, any> = {
      startTime: { $gte: filter.startOfDay, $lte: filter.endOfDay },
    };

    if (filter.doctorEmail) {
      query['doctorEmail'] = filter.doctorEmail;
    }

    if (filter.status) {
      query['status'] = filter.status;
    }

    return this.appointmentModel
      .find(query)
      .sort({ startTime: 1 })
      .select('-_id -__v')
      .lean<Appointment[]>()
      .exec();
  }

  async updateStatus(
    appointmentId: string,
    status: string,
    colorId?: string
  ): Promise<Appointment | null> {
    const update: Record<string, any> = { status };
    if (colorId) {
      update['colorId'] = colorId;
    }

    return this.appointmentModel
      .findOneAndUpdate(
        {
          $or: [
            { appointmentId },
            ...(appointmentId.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: appointmentId }] : []),
          ],
        },
        { $set: update },
        { new: true }
      )
      .select('-_id -__v')
      .lean<Appointment>()
      .exec();
  }

  async incrementContactCount(appointmentId: string): Promise<Appointment | null> {
    return this.appointmentModel
      .findOneAndUpdate(
        {
          $or: [
            { appointmentId },
            ...(appointmentId.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: appointmentId }] : []),
          ],
        },
        { $inc: { contactCount: 1 } },
        { new: true }
      )
      .select('-_id -__v')
      .lean<Appointment>()
      .exec();
  }
}

