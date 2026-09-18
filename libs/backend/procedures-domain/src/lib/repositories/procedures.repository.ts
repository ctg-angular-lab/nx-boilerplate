import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IProcedure } from '@nx-boilerplate/api-interfaces';
import { Procedure, ProcedureDocument } from '../schemas/procedure.schema';

@Injectable()
export class ProceduresRepository {
  constructor(
    @InjectModel(Procedure.name)
    private readonly procedureModel: Model<ProcedureDocument>
  ) {}

  async findAll(): Promise<IProcedure[]> {
    return this.procedureModel
      .find()
      .select('-_id -__v -createdAt -updatedAt')
      .lean<IProcedure[]>()
      .exec();
  }

  async findById(idProcedimiento: string): Promise<IProcedure | null> {
    return this.procedureModel
      .findOne({ idProcedimiento })
      .select('-_id -__v -createdAt -updatedAt')
      .lean<IProcedure>()
      .exec();
  }

  async findByDoctor(doctorCedula: string): Promise<IProcedure[]> {
    return this.procedureModel
      .find({ medicosRelacionados: doctorCedula })
      .select('-_id -__v -createdAt -updatedAt')
      .lean<IProcedure[]>()
      .exec();
  }

  async count(): Promise<number> {
    return this.procedureModel.countDocuments().exec();
  }

  async insertMany(procedures: IProcedure[]): Promise<void> {
    await this.procedureModel.insertMany(procedures);
  }
}
