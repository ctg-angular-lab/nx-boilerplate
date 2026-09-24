import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { ProceduresMessageController } from './procedures-message.controller';
import { ProceduresDomainService } from '@nx-boilerplate/backend/procedures-domain';
import { IProcedure } from '@nx-boilerplate/api-interfaces';

describe('ProceduresMessageController', () => {
  let controller: ProceduresMessageController;
  let service: ProceduresDomainService;

  const mockProcedures: IProcedure[] = [
    {
      idProcedimiento: 'PROC-EST-001',
      nombreProcedimiento: 'Armonización y Perfilado Labial con Ácido Hialurónico',
      valorStandar: 850000,
      duracionStandar: 45,
      medicosRelacionados: ['52890123', '1032456789'],
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProceduresMessageController],
      providers: [
        {
          provide: ProceduresDomainService,
          useValue: {
            getAll: vi.fn().mockResolvedValue(mockProcedures),
            getById: vi.fn().mockResolvedValue(mockProcedures[0]),
            getByDoctor: vi.fn().mockResolvedValue(mockProcedures),
            getDoctorsByProcedureId: vi.fn().mockResolvedValue([]),
          },
        },
      ],
    }).compile();

    controller = module.get<ProceduresMessageController>(
      ProceduresMessageController
    );
    service = module.get<ProceduresDomainService>(ProceduresDomainService);
  });

  it('debe estar definido', () => {
    expect(controller).toBeDefined();
  });

  it('debe atender procedures.get-all delegando al servicio', async () => {
    const result = await controller.getAll();
    expect(result).toEqual(mockProcedures);
    expect(service.getAll).toHaveBeenCalled();
  });

  it('debe atender procedures.find-by-id con el payload recibido', async () => {
    const result = await controller.findById({ idProcedimiento: 'PROC-EST-001' });
    expect(result).toEqual(mockProcedures[0]);
    expect(service.getById).toHaveBeenCalledWith('PROC-EST-001');
  });

  it('debe atender procedures.find-by-doctor con la cédula recibida', async () => {
    const result = await controller.findByDoctor({ doctorCedula: '52890123' });
    expect(result).toEqual(mockProcedures);
    expect(service.getByDoctor).toHaveBeenCalledWith('52890123');
  });

  it('debe atender procedures.get-doctors-by-procedure con el idProcedimiento recibido', async () => {
    const mockDoctors = [
      {
        cedula: '52890123',
        nombres: 'Dra. María',
        apellidos: 'Gómez',
        email: 'maria.gomez@clinica.com',
        profesion: 'Dermatóloga Estética',
        horarioTrabajo: {
          diasLaborales: ['Lunes', 'Miércoles'],
          horaInicio: '08:00',
          horaFin: '17:00',
        },
      },
    ];

    vi.spyOn(service, 'getDoctorsByProcedureId' as keyof ProceduresDomainService).mockResolvedValueOnce(
      mockDoctors as never
    );

    const result = await controller.getDoctorsByProcedure({
      idProcedimiento: 'PROC-EST-001',
    });

    expect(result).toEqual(mockDoctors);
    expect(service.getDoctorsByProcedureId).toHaveBeenCalledWith('PROC-EST-001');
  });
});

