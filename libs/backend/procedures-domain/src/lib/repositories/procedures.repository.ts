import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IActiveProfessional, IProcedure, IAreaCode } from '@nx-boilerplate/api-interfaces';
import { Procedure, ProcedureDocument } from '../schemas/procedure.schema';
import { AreaCode, AreaCodeDocument } from '../schemas/area-code.schema';
import {
  ActiveProfessional,
  ActiveProfessionalDocument,
} from '../schemas/active-professional.schema';

@Injectable()
export class ProceduresRepository {
  constructor(
    @InjectModel(Procedure.name)
    private readonly procedureModel: Model<ProcedureDocument>,
    @InjectModel(ActiveProfessional.name)
    private readonly professionalModel: Model<ActiveProfessionalDocument>,
    @InjectModel(AreaCode.name)
    private readonly areaCodeModel: Model<AreaCodeDocument>
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

  async findDoctorsByCedulas(cedulas: string[]): Promise<IActiveProfessional[]> {
    return this.professionalModel
      .find({ cedula: { $in: cedulas } })
      .select('-_id -__v -createdAt -updatedAt')
      .lean<IActiveProfessional[]>()
      .exec();
  }

  async findAllDoctors(): Promise<IActiveProfessional[]> {
    return this.professionalModel
      .find()
      .select('-_id -__v -createdAt -updatedAt')
      .lean<IActiveProfessional[]>()
      .exec();
  }

  async count(): Promise<number> {
    return this.procedureModel.countDocuments().exec();
  }

  async insertMany(procedures: IProcedure[]): Promise<void> {
    await this.procedureModel.insertMany(procedures);
  }

  async findAllAreaCodes(): Promise<IAreaCode[]> {
    return this.areaCodeModel
      .find(
        {},
        {
          _id: 0,
          code: 1,
          country: 1,
          flag: 1,
          pattern: 1,
          errorMessage: 1,
        }
      )
      .sort({ country: 1 })
      .lean<IAreaCode[]>()
      .exec();
  }
}

