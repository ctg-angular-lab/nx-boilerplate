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
    nombre: 'Laura Sofía',
    apellidos: 'Gómez',
    correo: 'laura.gomez@example.com',
    celular: '3001234567',
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
            findAllPatients: vi.fn().mockResolvedValue([mockPatient]),
            findByNationalId: vi.fn().mockResolvedValue(mockPatient),
            createPatient: vi.fn().mockResolvedValue(mockPatient),
            updatePatient: vi.fn().mockResolvedValue({
              ...mockPatient,
              ocupacion: 'Ingeniera',
            }),
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

  it('debe delegar la consulta de todos los pacientes', async () => {
    const result = await controller.findAllPatients();
    expect(service.findAllPatients).toHaveBeenCalled();
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(mockPatient);
  });

  it('debe delegar la búsqueda al servicio de dominio con el nationalId recibido', async () => {
    const payload = { nationalId: '1020304050' };
    const result = await controller.findByNationalId(payload);

    expect(service.findByNationalId).toHaveBeenCalledWith('1020304050');
    expect(result).toEqual(mockPatient);
  });

  it('debe delegar la creación de paciente al servicio de dominio con el payload recibido', async () => {
    const payload = {
      cedula: '1020304050',
      nombre: 'Laura Sofía',
      apellidos: 'Gómez',
      correo: 'laura.gomez@example.com',
      celular: '3001234567',
    };
    const result = await controller.createPatient(payload);

    expect(service.createPatient).toHaveBeenCalledWith(payload);
    expect(result).toEqual(mockPatient);
  });

  it('debe delegar la actualización de datos del paciente', async () => {
    const payload = {
      nationalId: '1020304050',
      data: {
        ocupacion: 'Ingeniera',
      },
    };
    const result = await controller.updatePatient(payload);

    expect(service.updatePatient).toHaveBeenCalledWith('1020304050', { ocupacion: 'Ingeniera' });
    expect(result.ocupacion).toBe('Ingeniera');
  });
});
