import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { RpcException } from '@nestjs/microservices';
import { IProcedure } from '@nx-boilerplate/api-interfaces';
import { ProceduresDomainService } from './procedures-domain.service';
import { ProceduresRepository } from '../repositories/procedures.repository';

describe('ProceduresDomainService', () => {
  let service: ProceduresDomainService;
  let repository: ProceduresRepository;

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
});
