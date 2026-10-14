import { Inject, Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { IWorkSchedule } from '@nx-boilerplate/api-interfaces';
import {
  PROFESSIONAL_SCHEDULE_PROVIDER,
  IProfessionalScheduleProvider,
} from '../ports/professional-schedule-provider.port';
import { DEFAULT_SCHEDULE } from '../utils/slot-calculator';

@Injectable()
export class WorkScheduleService {
  private readonly logger = new Logger(WorkScheduleService.name);

  constructor(
    @Inject(PROFESSIONAL_SCHEDULE_PROVIDER)
    private readonly scheduleProvider: IProfessionalScheduleProvider
  ) {}

  /**
   * Resuelve el horario configurado del especialista médico a través del proveedor.
   * @param allowFallback Si es true, retorna DEFAULT_SCHEDULE con advertencia; si es false, lanza RpcException.
   */
  async resolveProfessionalSchedule(
    doctorEmail?: string,
    doctorCedula?: string,
    allowFallback = true
  ): Promise<IWorkSchedule> {
    const schedule = await this.scheduleProvider.getSchedule(doctorEmail, doctorCedula);

    if (schedule) {
      return schedule;
    }

    if (!allowFallback) {
      throw new RpcException('Profesional médico no encontrado en la base de datos');
    }

    this.logger.warn(
      `Usando horario por defecto para profesional ${doctorEmail || doctorCedula || 'desconocido'}`
    );
    return DEFAULT_SCHEDULE;
  }
}
