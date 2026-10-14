import { IWorkSchedule } from '@nx-boilerplate/api-interfaces';

export const PROFESSIONAL_SCHEDULE_PROVIDER = Symbol('PROFESSIONAL_SCHEDULE_PROVIDER');

export interface IProfessionalScheduleProvider {
  /**
   * Resuelve el horario configurado de un profesional médico a partir de su correo o cédula.
   * Retorna null si no se encuentra registrado en el sistema.
   */
  getSchedule(doctorEmail?: string, doctorCedula?: string): Promise<IWorkSchedule | null>;
}
