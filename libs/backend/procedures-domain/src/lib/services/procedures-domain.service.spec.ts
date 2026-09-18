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
});
