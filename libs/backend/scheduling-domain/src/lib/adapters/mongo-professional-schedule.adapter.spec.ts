import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MongoProfessionalScheduleAdapter } from './mongo-professional-schedule.adapter';

describe('MongoProfessionalScheduleAdapter', () => {
  let adapter: MongoProfessionalScheduleAdapter;
  let mockModel: any;

  beforeEach(() => {
    mockModel = {
      findOne: vi.fn(),
    };
    adapter = new MongoProfessionalScheduleAdapter(mockModel);
  });

  it('debe retornar null si no se proporciona ni email ni cédula', async () => {
    const result = await adapter.getSchedule();
    expect(result).toBeNull();
    expect(mockModel.findOne).not.toHaveBeenCalled();
  });

  it('debe consultar y retornar el horario de trabajo si el profesional existe', async () => {
    const mockHorario = {
      diasLaborales: ['LUNES', 'MARTES'],
      horaInicio: '08:00',
      horaFin: '17:00',
    };
    mockModel.findOne.mockReturnValue({
      lean: vi.fn().mockReturnValue({
        exec: vi.fn().mockResolvedValue({ horarioTrabajo: mockHorario }),
      }),
    });

    const result = await adapter.getSchedule('dr@example.com', '12345');
    expect(result).toEqual(mockHorario);
  });

  it('debe capturar errores de base de datos y retornar null sin propagar excepción', async () => {
    mockModel.findOne.mockReturnValue({
      lean: vi.fn().mockReturnValue({
        exec: vi.fn().mockRejectedValue(new Error('Mongo connection timeout')),
      }),
    });

    const result = await adapter.getSchedule('dr@example.com');
    expect(result).toBeNull();
  });
});
