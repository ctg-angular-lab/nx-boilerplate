import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { PatientsMessageController } from './patients-message.controller';
import { PatientsDomainService } from '@nx-boilerplate/backend/patients-domain';
import { IPatientHistory } from '@nx-boilerplate/api-interfaces';

describe('PatientsMessageController', () => {
  let controller: PatientsMessageController;
  let service: PatientsDomainService;

  const mockPatient: IPatientHistory = {
    cedula: '1020304050',
    nombreCompleto: 'Laura Sofía Gómez',
    ultimosProcedimientos: [],
    recomendaciones: 'Ninguna',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PatientsMessageController],
      providers: [
        {
          provide: PatientsDomainService,
          useValue: {
            findByNationalId: vi.fn().mockResolvedValue(mockPatient),
          },
        },
      ],
    }).compile();

    controller = module.get<PatientsMessageController>(PatientsMessageController);
    service = module.get<PatientsDomainService>(PatientsDomainService);
  });

  it('debe estar definido', () => {
    expect(controller).toBeDefined();
  });

  it('debe delegar la búsqueda al servicio de dominio con el nationalId recibido', async () => {
    const payload = { nationalId: '1020304050' };
    const result = await controller.findByNationalId(payload);

    expect(service.findByNationalId).toHaveBeenCalledWith('1020304050');
    expect(result).toEqual(mockPatient);
  });
});
