import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { RpcException } from '@nestjs/microservices';
import { IPatientHistory } from '@nx-boilerplate/api-interfaces';
import { PatientsDomainService } from './patients-domain.service';
import { PatientsRepository } from '../repositories/patients.repository';

describe('PatientsDomainService', () => {
  let service: PatientsDomainService;
  let repository: PatientsRepository;

  const mockPatient: IPatientHistory = {
    cedula: '1020304050',
    nombreCompleto: 'Laura Sofía Gómez',
    ultimosProcedimientos: [
      {
        id: 'proc-101',
        nombre: 'Profilaxis y Valoración Periodontal',
        fecha: '2026-02-14',
        profesional: 'Dra. María Gómez',
      },
    ],
    recomendaciones: 'Paciente en control preventivo.',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatientsDomainService,
        {
          provide: PatientsRepository,
          useValue: {
            findByCedula: vi.fn().mockImplementation((cedula: string) => {
              if (cedula === '1020304050') {
                return Promise.resolve(mockPatient);
              }
              return Promise.resolve(null);
            }),
          },
        },
      ],
    }).compile();

    service = module.get<PatientsDomainService>(PatientsDomainService);
    repository = module.get<PatientsRepository>(PatientsRepository);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  it('debe retornar el historial cuando el paciente existe en el repositorio', async () => {
    const result = await service.findByNationalId('1020304050');
    expect(result).toBeDefined();
    expect(result.cedula).toBe('1020304050');
    expect(result.nombreCompleto).toBe('Laura Sofía Gómez');
    expect(repository.findByCedula).toHaveBeenCalledWith('1020304050');
  });

  it('debe lanzar RpcException con status 404 cuando el paciente no existe en el repositorio', async () => {
    try {
      await service.findByNationalId('9999999999');
      expect.unreachable('Se esperaba que lanzara RpcException');
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(RpcException);
      const rpcError = error as RpcException;
      const errPayload = rpcError.getError();
      expect(errPayload).toEqual(
        expect.objectContaining({
          status: 'error',
          code: 404,
          message: 'Paciente no encontrado con el documento proporcionado',
        })
      );
    }
  });
});
