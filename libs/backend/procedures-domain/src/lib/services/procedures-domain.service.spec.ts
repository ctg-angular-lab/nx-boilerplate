import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { getConnectionToken } from '@nestjs/mongoose';
import { RpcException } from '@nestjs/microservices';
import { IProcedure } from '@nx-boilerplate/api-interfaces';
import { CreateProfessionalDto } from '@nx-boilerplate/shared-dtos';
import { ProceduresDomainService } from './procedures-domain.service';
import { ProceduresRepository } from '../repositories/procedures.repository';
import { ActiveProfessionalDocument } from '../schemas/active-professional.schema';

describe('ProceduresDomainService', () => {
  let service: ProceduresDomainService;
  let repository: ProceduresRepository;

  const mockSession = {
    startTransaction: vi.fn(),
    commitTransaction: vi.fn(),
    abortTransaction: vi.fn(),
    endSession: vi.fn(),
  };

  const mockConnection = {
    startSession: vi.fn().mockResolvedValue(mockSession),
  };

  const mockProcedures: IProcedure[] = [
    {
      idProcedimiento: 'PROC-EST-001',
      nombreProcedimiento: 'Armonización y Perfilado Labial con Ácido Hialurónico',
      valorStandar: 850000,
      duracionStandar: 45,
      medicosRelacionados: ['52890123', '1032456789'],
    },
    {
      idProcedimiento: 'PROC-EST-002',
      nombreProcedimiento: 'Aplicación de Toxina Botulínica',
      valorStandar: 720000,
      duracionStandar: 40,
      medicosRelacionados: ['52890123', '71345678'],
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProceduresDomainService,
        {
          provide: getConnectionToken(),
          useValue: mockConnection,
        },
        {
          provide: ProceduresRepository,
          useValue: {
            findAll: vi.fn().mockResolvedValue(mockProcedures),
            findById: vi.fn().mockImplementation((id: string) => {
              const found = mockProcedures.find((p) => p.idProcedimiento === id);
              return Promise.resolve(found || null);
            }),
            findByDoctor: vi.fn().mockImplementation((cedula: string) => {
              const filtered = mockProcedures.filter((p) =>
                p.medicosRelacionados.includes(cedula)
              );
              return Promise.resolve(filtered);
            }),
            findProfessionalByCedula: vi.fn(),
            createProfessional: vi.fn(),
            updateProfessional: vi.fn(),
            addDoctorToProcedures: vi.fn(),
            pullDoctorFromProcedures: vi.fn(),
            findAllDoctors: vi.fn(),
            findAllAreaCodes: vi.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ProceduresDomainService>(ProceduresDomainService);
    repository = module.get<ProceduresRepository>(ProceduresRepository);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  it('debe retornar todos los procedimientos con getAll', async () => {
    const result = await service.getAll();
    expect(result).toHaveLength(2);
    expect(repository.findAll).toHaveBeenCalled();
  });

  it('debe retornar un procedimiento por su id con getById', async () => {
    const result = await service.getById('PROC-EST-001');
    expect(result.nombreProcedimiento).toContain('Armonización');
    expect(repository.findById).toHaveBeenCalledWith('PROC-EST-001');
  });

  it('debe lanzar RpcException 404 si el id no existe', async () => {
    try {
      await service.getById('INEXISTENTE');
      expect.unreachable('Se esperaba que lanzara RpcException');
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(RpcException);
      const rpcError = error as RpcException;
      const errPayload = rpcError.getError();
      expect(errPayload).toEqual(
        expect.objectContaining({
          status: 'error',
          code: 404,
          message: 'Procedimiento médico no encontrado',
        })
      );
    }
  });

  it('debe filtrar los procedimientos por médico con getByDoctor', async () => {
    const result = await service.getByDoctor('71345678');
    expect(result).toHaveLength(1);
    expect(result[0].idProcedimiento).toBe('PROC-EST-002');
    expect(repository.findByDoctor).toHaveBeenCalledWith('71345678');
  });

  describe('getDoctorsByProcedureId', () => {
    it('debe retornar los médicos asociados al procedimiento', async () => {
      const mockDoctors = [
        {
          cedula: '52890123',
          nombres: 'Dra. María',
          apellidos: 'Gómez',
          email: 'maria.gomez@clinica.com',
          profesion: 'Dermatóloga Estética',
          procedimientosRelacionados: ['PROC-EST-001'],
          horarioTrabajo: {
            diasLaborales: ['Lunes', 'Miércoles', 'Viernes'],
            horaInicio: '08:00',
            horaFin: '17:00',
          },
        },
      ];

      (repository as unknown as { findDoctorsByCedulas: ReturnType<typeof vi.fn> }).findDoctorsByCedulas =
        vi.fn().mockResolvedValue(mockDoctors);

      const result = await service.getDoctorsByProcedureId('PROC-EST-001');

      expect(result).toHaveLength(1);
      expect(result[0].cedula).toBe('52890123');
      expect(result[0].nombres).toBe('Dra. María');
      expect(result[0].profesion).toBe('Dermatóloga Estética');
      expect(repository.findDoctorsByCedulas).toHaveBeenCalledWith(['52890123', '1032456789']);
    });

    it('debe retornar arreglo vacío si el procedimiento no tiene médicos relacionados', async () => {
      const procWithoutDoctors: IProcedure = {
        idProcedimiento: 'PROC-SIN-MEDICOS',
        nombreProcedimiento: 'Procedimiento Sin Médicos',
        valorStandar: 100000,
        duracionStandar: 30,
        medicosRelacionados: [],
      };

      vi.spyOn(repository, 'findById').mockResolvedValueOnce(procWithoutDoctors);

      const result = await service.getDoctorsByProcedureId('PROC-SIN-MEDICOS');

      expect(result).toEqual([]);
    });

    it('debe lanzar RpcException 404 si el procedimiento no existe al consultar médicos', async () => {
      try {
        await service.getDoctorsByProcedureId('PROC-INEXISTENTE');
        expect.unreachable('Se esperaba que lanzara RpcException');
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(RpcException);
        const rpcError = error as RpcException;
        const errPayload = rpcError.getError();
        expect(errPayload).toEqual(
          expect.objectContaining({
            status: 'error',
            code: 404,
            message: 'Procedimiento médico no encontrado',
          })
        );
      }
    });
  });

  describe('createProfessional', () => {
    const createDto = {
      cedula: '12345678',
      nombres: 'Carlos',
      apellidos: 'Pérez',
      email: 'carlos.perez@clinica.com',
      profesion: 'Médico Estético',
      procedimientosRelacionados: ['PROC-EST-001'],
      horarioTrabajo: {
        diasLaborales: ['Lunes', 'Martes'],
        horaInicio: '08:00',
        horaFin: '17:00',
      },
    };

    it('debe crear un profesional y sincronizar procedimientos', async () => {
      vi.spyOn(repository, 'findProfessionalByCedula').mockResolvedValue(null);
      vi.spyOn(repository, 'createProfessional').mockResolvedValue({
        ...createDto,
        isActive: true,
        horariosExcepcionales: [],
      } as unknown as ActiveProfessionalDocument);

      const result = await service.createProfessional(
        createDto as unknown as CreateProfessionalDto
      );

      expect(result.cedula).toBe('12345678');
      expect(repository.findProfessionalByCedula).toHaveBeenCalledWith('12345678');
      expect(repository.createProfessional).toHaveBeenCalled();
      expect(repository.addDoctorToProcedures).toHaveBeenCalledWith(
        ['PROC-EST-001'],
        '12345678',
        mockSession
      );
      expect(mockSession.commitTransaction).toHaveBeenCalled();
    });

    it('debe lanzar RpcException 409 si la cédula ya existe', async () => {
      vi.spyOn(repository, 'findProfessionalByCedula').mockResolvedValue({
        cedula: '12345678',
      } as unknown as ActiveProfessionalDocument);

      await expect(
        service.createProfessional(createDto as unknown as CreateProfessionalDto)
      ).rejects.toThrow(RpcException);
    });
  });

  describe('updateProfessional', () => {
    const existingDoctor = {
      cedula: '12345678',
      nombres: 'Carlos',
      apellidos: 'Pérez',
      procedimientosRelacionados: ['PROC-EST-001', 'PROC-EST-002'],
    };

    it('debe sincronizar bidireccionalmente al actualizar procedimientos (pull y addToSet)', async () => {
      vi.spyOn(repository, 'findProfessionalByCedula').mockResolvedValue(
        existingDoctor as unknown as ActiveProfessionalDocument
      );
      vi.spyOn(repository, 'updateProfessional').mockResolvedValue({
        ...existingDoctor,
        procedimientosRelacionados: ['PROC-EST-002', 'PROC-EST-003'],
      } as unknown as ActiveProfessionalDocument);

      const result = await service.updateProfessional('12345678', {
        procedimientosRelacionados: ['PROC-EST-002', 'PROC-EST-003'],
      });

      expect(repository.pullDoctorFromProcedures).toHaveBeenCalledWith(
        ['PROC-EST-001'],
        '12345678',
        mockSession
      );
      expect(repository.addDoctorToProcedures).toHaveBeenCalledWith(
        ['PROC-EST-003'],
        '12345678',
        mockSession
      );
      expect(mockSession.commitTransaction).toHaveBeenCalled();
      expect(result.cedula).toBe('12345678');
    });

    it('debe lanzar RpcException 404 si el profesional no existe', async () => {
      vi.spyOn(repository, 'findProfessionalByCedula').mockResolvedValue(null);

      await expect(
        service.updateProfessional('INEXISTENTE', { nombres: 'Nuevo' })
      ).rejects.toThrow(RpcException);
      expect(mockSession.abortTransaction).toHaveBeenCalled();
    });
  });

  describe('softDeleteProfessional', () => {
    it('debe desactivar al profesional cambiando isActive a false', async () => {
      vi.spyOn(repository, 'findProfessionalByCedula').mockResolvedValue({
        cedula: '12345678',
        isActive: true,
      } as unknown as ActiveProfessionalDocument);
      vi.spyOn(repository, 'updateProfessional').mockResolvedValue({
        cedula: '12345678',
        isActive: false,
      } as unknown as ActiveProfessionalDocument);

      const result = await service.softDeleteProfessional('12345678');

      expect(result.success).toBe(true);
      expect(result.isActive).toBe(false);
      expect(repository.updateProfessional).toHaveBeenCalledWith('12345678', {
        isActive: false,
      });
    });

    it('debe lanzar RpcException 404 si el profesional no existe', async () => {
      vi.spyOn(repository, 'findProfessionalByCedula').mockResolvedValue(null);

      await expect(service.softDeleteProfessional('INEXISTENTE')).rejects.toThrow(
        RpcException
      );
    });
  });

  describe('updateScheduleExceptions', () => {
    it('debe guardar excepciones de horario para el profesional', async () => {
      const exceptions = [
        {
          fecha: '2026-11-01',
          horaInicio: '08:00',
          horaFin: '12:00',
          tipo: 'EXTRA_SHIFT' as const,
        },
      ];

      vi.spyOn(repository, 'findProfessionalByCedula').mockResolvedValue({
        cedula: '12345678',
      } as unknown as ActiveProfessionalDocument);
      vi.spyOn(repository, 'updateProfessional').mockResolvedValue({
        cedula: '12345678',
        horariosExcepcionales: exceptions,
      } as unknown as ActiveProfessionalDocument);

      const result = await service.updateScheduleExceptions(
        '12345678',
        exceptions
      );

      expect(result.horariosExcepcionales).toEqual(exceptions);
      expect(repository.updateProfessional).toHaveBeenCalledWith('12345678', {
        horariosExcepcionales: exceptions,
      });
    });
  });
});
