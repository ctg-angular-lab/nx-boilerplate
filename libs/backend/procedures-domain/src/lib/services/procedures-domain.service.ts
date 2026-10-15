import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { RpcException } from '@nestjs/microservices';
import {
  IActiveProfessional,
  IProcedure,
  IProfessionalSummary,
  IAreaCode,
  IExceptionSchedule,
} from '@nx-boilerplate/api-interfaces';
import {
  CreateProfessionalDto,
  UpdateProfessionalDto,
} from '@nx-boilerplate/shared-dtos';
import { ProceduresRepository } from '../repositories/procedures.repository';
import { ActiveProfessionalDocument } from '../schemas/active-professional.schema';

@Injectable()
export class ProceduresDomainService {
  constructor(
    private readonly proceduresRepository: ProceduresRepository,
    @InjectConnection() private readonly connection: Connection
  ) {}

  async getAll(): Promise<IProcedure[]> {
    return this.proceduresRepository.findAll();
  }

  async getById(idProcedimiento: string): Promise<IProcedure> {
    const procedure = await this.proceduresRepository.findById(idProcedimiento);

    if (!procedure) {
      throw new RpcException({
        status: 'error',
        code: 404,
        message: 'Procedimiento médico no encontrado',
        timestamp: new Date().toISOString(),
      });
    }

    return procedure;
  }

  async getByDoctor(doctorCedula: string): Promise<IProcedure[]> {
    return this.proceduresRepository.findByDoctor(doctorCedula);
  }

  async getDoctorsByProcedureId(
    idProcedimiento: string
  ): Promise<IProfessionalSummary[]> {
    const procedure = await this.getById(idProcedimiento);

    if (
      !procedure.medicosRelacionados ||
      procedure.medicosRelacionados.length === 0
    ) {
      return [];
    }

    const doctors = await this.proceduresRepository.findDoctorsByCedulas(
      procedure.medicosRelacionados
    );

    return doctors.map((doc) => ({
      cedula: doc.cedula,
      nombres: doc.nombres,
      apellidos: doc.apellidos,
      email: doc.email,
      profesion: doc.profesion,
      horarioTrabajo: doc.horarioTrabajo,
    }));
  }

  async getAllDoctors(includeInactive = false): Promise<IActiveProfessional[]> {
    return this.proceduresRepository.findAllDoctors(includeInactive);
  }

  async getAllAreaCodes(): Promise<IAreaCode[]> {
    return this.proceduresRepository.findAllAreaCodes();
  }

  async createProfessional(
    dto: CreateProfessionalDto
  ): Promise<ActiveProfessionalDocument> {
    const existing = await this.proceduresRepository.findProfessionalByCedula(
      dto.cedula
    );

    if (existing) {
      throw new RpcException({
        status: 'error',
        code: 409,
        message: `El profesional con cédula ${dto.cedula} ya se encuentra registrado`,
        timestamp: new Date().toISOString(),
      });
    }

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const created = await this.proceduresRepository.createProfessional(
        {
          ...dto,
          isActive: true,
          horariosExcepcionales: [],
        },
        session
      );

      if (
        dto.procedimientosRelacionados &&
        dto.procedimientosRelacionados.length > 0
      ) {
        await this.proceduresRepository.addDoctorToProcedures(
          dto.procedimientosRelacionados,
          dto.cedula,
          session
        );
      }

      await session.commitTransaction();
      return created;
    } catch (error) {
      await session.abortTransaction();
      if (error instanceof RpcException) throw error;
      throw new RpcException({
        status: 'error',
        code: 500,
        message: `Error al crear el profesional: ${(error as Error).message}`,
        timestamp: new Date().toISOString(),
      });
    } finally {
      session.endSession();
    }
  }

  async updateProfessional(
    cedula: string,
    dto: UpdateProfessionalDto
  ): Promise<ActiveProfessionalDocument> {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const currentDoctor =
        await this.proceduresRepository.findProfessionalByCedula(
          cedula,
          session
        );

      if (!currentDoctor) {
        throw new RpcException({
          status: 'error',
          code: 404,
          message: `Profesional con cédula ${cedula} no encontrado`,
          timestamp: new Date().toISOString(),
        });
      }

      // Sincronización bidireccional si se actualizan los procedimientos
      if (dto.procedimientosRelacionados !== undefined) {
        const oldProcedures = currentDoctor.procedimientosRelacionados || [];
        const newProcedures = dto.procedimientosRelacionados;

        const removed = oldProcedures.filter((id) => !newProcedures.includes(id));
        const added = newProcedures.filter((id) => !oldProcedures.includes(id));

        if (removed.length > 0) {
          await this.proceduresRepository.pullDoctorFromProcedures(
            removed,
            cedula,
            session
          );
        }

        if (added.length > 0) {
          await this.proceduresRepository.addDoctorToProcedures(
            added,
            cedula,
            session
          );
        }
      }

      const updated = await this.proceduresRepository.updateProfessional(
        cedula,
        dto,
        session
      );

      if (!updated) {
        throw new RpcException({
          status: 'error',
          code: 404,
          message: `No fue posible actualizar el profesional con cédula ${cedula}`,
          timestamp: new Date().toISOString(),
        });
      }

      await session.commitTransaction();
      return updated;
    } catch (error) {
      await session.abortTransaction();
      if (error instanceof RpcException) throw error;
      throw new RpcException({
        status: 'error',
        code: 500,
        message: `Error al actualizar profesional: ${(error as Error).message}`,
        timestamp: new Date().toISOString(),
      });
    } finally {
      session.endSession();
    }
  }

  async softDeleteProfessional(cedula: string): Promise<{
    success: boolean;
    message: string;
    cedula: string;
    isActive: boolean;
  }> {
    const professional =
      await this.proceduresRepository.findProfessionalByCedula(cedula);

    if (!professional) {
      throw new RpcException({
        status: 'error',
        code: 404,
        message: `Profesional con cédula ${cedula} no encontrado`,
        timestamp: new Date().toISOString(),
      });
    }

    await this.proceduresRepository.updateProfessional(cedula, {
      isActive: false,
    });

    return {
      success: true,
      message: `Profesional ${cedula} desactivado correctamente`,
      cedula,
      isActive: false,
    };
  }

  async updateScheduleExceptions(
    cedula: string,
    exceptions: IExceptionSchedule[]
  ): Promise<ActiveProfessionalDocument> {
    const professional =
      await this.proceduresRepository.findProfessionalByCedula(cedula);

    if (!professional) {
      throw new RpcException({
        status: 'error',
        code: 404,
        message: `Profesional con cédula ${cedula} no encontrado`,
        timestamp: new Date().toISOString(),
      });
    }

    const updated = await this.proceduresRepository.updateProfessional(cedula, {
      horariosExcepcionales: exceptions,
    });

    if (!updated) {
      throw new RpcException({
        status: 'error',
        code: 404,
        message: `Error al guardar excepciones de horario para el profesional con cédula ${cedula}`,
        timestamp: new Date().toISOString(),
      });
    }

    return updated;
  }
}

