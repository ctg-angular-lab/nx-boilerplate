import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, ClientSession } from 'mongoose';
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
    private readonly areaCodeModel: Model<AreaCodeDocument>,
    @InjectConnection()
    private readonly connection: Connection
  ) {}

  getConnection(): Connection {
    return this.connection;
  }

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
      .find({ cedula: { $in: cedulas }, isActive: { $ne: false } })
      .select('-_id -__v -createdAt -updatedAt')
      .lean<IActiveProfessional[]>()
      .exec();
  }

  async findAllDoctors(includeInactive = false): Promise<IActiveProfessional[]> {
    const filter = includeInactive ? {} : { isActive: { $ne: false } };
    return this.professionalModel
      .find(filter)
      .select('-_id -__v -createdAt -updatedAt')
      .lean<IActiveProfessional[]>()
      .exec();
  }

  async createProfessional(
    data: Partial<ActiveProfessional>,
    session?: ClientSession
  ): Promise<ActiveProfessionalDocument> {
    const [created] = await this.professionalModel.create([data], { session });
    return created;
  }

  async findProfessionalByCedula(
    cedula: string,
    session?: ClientSession
  ): Promise<ActiveProfessionalDocument | null> {
    return this.professionalModel
      .findOne({ cedula })
      .session(session || null)
      .exec();
  }

  async updateProfessional(
    cedula: string,
    data: Partial<ActiveProfessional>,
    session?: ClientSession
  ): Promise<ActiveProfessionalDocument | null> {
    return this.professionalModel
      .findOneAndUpdate(
        { cedula },
        { $set: data },
        { new: true, session, runValidators: true }
      )
      .exec();
  }

  async pullDoctorFromProcedures(
    procedureIds: string[],
    doctorCedula: string,
    session?: ClientSession
  ): Promise<void> {
    if (!procedureIds || procedureIds.length === 0) return;
    await this.procedureModel
      .updateMany(
        { idProcedimiento: { $in: procedureIds } },
        { $pull: { medicosRelacionados: doctorCedula } },
        { session }
      )
      .exec();
  }

  async addDoctorToProcedures(
    procedureIds: string[],
    doctorCedula: string,
    session?: ClientSession
  ): Promise<void> {
    if (!procedureIds || procedureIds.length === 0) return;
    await this.procedureModel
      .updateMany(
        { idProcedimiento: { $in: procedureIds } },
        { $addToSet: { medicosRelacionados: doctorCedula } },
        { session }
      )
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

