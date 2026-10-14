import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WorkScheduleService } from './work-schedule.service';
import { IProfessionalScheduleProvider } from '../ports/professional-schedule-provider.port';
import { RpcException } from '@nestjs/microservices';
import { DEFAULT_SCHEDULE } from '../utils/slot-calculator';

describe('WorkScheduleService', () => {
  let service: WorkScheduleService;
  let mockProvider: IProfessionalScheduleProvider;

  beforeEach(() => {
    mockProvider = {
      getSchedule: vi.fn(),
    };
    service = new WorkScheduleService(mockProvider);
  });

  it('debe retornar el horario configurado si el profesional existe', async () => {
    const mockSchedule = {
      diasLaborales: ['LUNES', 'MIERCOLES'],
      horaInicio: '08:00',
      horaFin: '16:00',
    };
    vi.spyOn(mockProvider, 'getSchedule').mockResolvedValue(mockSchedule);

    const result = await service.resolveProfessionalSchedule('dr@example.com', '12345');
    expect(result).toEqual(mockSchedule);
    expect(mockProvider.getSchedule).toHaveBeenCalledWith('dr@example.com', '12345');
  });

  it('debe retornar DEFAULT_SCHEDULE si no se encuentra y allowFallback es true', async () => {
    vi.spyOn(mockProvider, 'getSchedule').mockResolvedValue(null);

    const result = await service.resolveProfessionalSchedule('desconocido@example.com', undefined, true);
    expect(result).toEqual(DEFAULT_SCHEDULE);
  });

  it('debe lanzar RpcException si no se encuentra y allowFallback es false', async () => {
    vi.spyOn(mockProvider, 'getSchedule').mockResolvedValue(null);

    await expect(
      service.resolveProfessionalSchedule('desconocido@example.com', undefined, false)
    ).rejects.toThrow(RpcException);
  });
});
