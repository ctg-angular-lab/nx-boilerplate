import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { ProceduresMessageController } from './procedures-message.controller';
import { ProceduresDomainService } from '@nx-boilerplate/backend/procedures-domain';
import {
  IProcedure,
  IProcedureSoftDeleteResponse,
} from '@nx-boilerplate/api-interfaces';
import {
  CreateProcedureDto,
  UpdateProcedureMessageDto,
} from '@nx-boilerplate/shared-dtos';

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
      isActive: true,
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
            getAllDoctors: vi.fn().mockResolvedValue([]),
            getAllAreaCodes: vi.fn().mockResolvedValue([]),
            createProcedure: vi.fn().mockResolvedValue(mockProcedures[0]),
            updateProcedure: vi.fn().mockResolvedValue(mockProcedures[0]),
            softDeleteProcedure: vi.fn().mockResolvedValue({
              success: true,
              message: 'Desactivado',
              idProcedimiento: 'PROC-EST-001',
              isActive: false,
            } as IProcedureSoftDeleteResponse),
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

  it('debe atender procedures.get-all delegando al servicio sin payload', async () => {
    const result = await controller.getAll();
    expect(result).toEqual(mockProcedures);
    expect(service.getAll).toHaveBeenCalledWith(false);
  });

  it('debe atender procedures.get-all delegando al servicio con includeInactive: true', async () => {
    const result = await controller.getAll({ includeInactive: true });
    expect(result).toEqual(mockProcedures);
    expect(service.getAll).toHaveBeenCalledWith(true);
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

  it('debe atender procedures.create delegando al servicio de dominio', async () => {
    const createDto: CreateProcedureDto = {
      nombreProcedimiento: 'Nuevo Procedimiento',
      valorStandar: 500000,
      duracionStandar: 30,
    };

    const result = await controller.createProcedure(createDto);

    expect(result).toEqual(mockProcedures[0]);
    expect(service.createProcedure).toHaveBeenCalledWith(createDto);
  });

  it('debe atender procedures.update delegando al servicio de dominio', async () => {
    const updatePayload: UpdateProcedureMessageDto = {
      idProcedimiento: 'PROC-EST-001',
      data: {
        nombreProcedimiento: 'Procedimiento Actualizado',
        valorStandar: 600000,
      },
    };

    const result = await controller.updateProcedure(updatePayload);

    expect(result).toEqual(mockProcedures[0]);
    expect(service.updateProcedure).toHaveBeenCalledWith(
      updatePayload.idProcedimiento,
      updatePayload.data
    );
  });

  it('debe atender procedures.soft-delete delegando al servicio de dominio', async () => {
    const result = await controller.softDeleteProcedure({
      idProcedimiento: 'PROC-EST-001',
    });

    expect(result.success).toBe(true);
    expect(result.isActive).toBe(false);
    expect(service.softDeleteProcedure).toHaveBeenCalledWith('PROC-EST-001');
  });

  it('debe atender doctors.get-all delegando al servicio con includeInactive', async () => {
    const mockAllDoctors = [
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

    vi.spyOn(service, 'getAllDoctors').mockResolvedValueOnce(mockAllDoctors as never);

    const result = await controller.getAllDoctors({ includeInactive: true });

    expect(result).toEqual(mockAllDoctors);
    expect(service.getAllDoctors).toHaveBeenCalledWith(true);
  });

  it('debe atender area-codes.get-all delegando al servicio', async () => {
    const mockAreaCodes = [
      {
        code: '+57',
        country: 'Colombia',
        flag: '🇨🇴',
        pattern: '^3\\d{9}$',
        errorMessage: 'Debe empezar por 3 y tener 10 dígitos',
      },
      {
        code: '+1',
        country: 'Estados Unidos',
        flag: '🇺🇸',
        pattern: '^\\d{10}$',
        errorMessage: 'Debe tener 10 dígitos',
      },
    ];

    vi.spyOn(service, 'getAllAreaCodes').mockResolvedValueOnce(mockAreaCodes as never);

    const result = await controller.getAllAreaCodes();

    expect(result).toEqual(mockAreaCodes);
    expect(service.getAllAreaCodes).toHaveBeenCalled();
  });
});
