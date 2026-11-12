import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { RpcException } from '@nestjs/microservices';
import { IPatientHistory, ICitaMedica } from '@nx-boilerplate/api-interfaces';
import { PatientsDomainService } from './patients-domain.service';
import { PatientsRepository } from '../repositories/patients.repository';
import { ClinicalRecordsRepository } from '../repositories/clinical-records.repository';
import { ProfessionalNamesRepository } from '../repositories/professional-names.repository';

describe('PatientsDomainService', () => {
  let service: PatientsDomainService;
  let patientsRepository: PatientsRepository;
  let clinicalRecordsRepository: ClinicalRecordsRepository;

  const mockPatient: IPatientHistory = {
    cedula: '1020304050',
    nombre: 'Laura Sofía',
    apellidos: 'Gómez',
    correo: 'laura.gomez@example.com',
    celular: '3001234567',
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

  const mockClinicalRecord: ICitaMedica = {
    _id: 'rec-1',
    appointmentId: 'APT-100',
    cedula_paciente: '1020304050',
    estado_registro: 'COMPLETADA',
    medico_tratante: [
      {
        cedula_profesional: 'DOC-1',
        nombre_profesional: 'Dra. María Gómez',
        fecha_atencion: new Date('2026-10-20'),
      },
    ],
    registro_clinico: {
      motivo_consulta: 'Control',
      enfermedad_actual: '',
      antecedentes_medicos: {
        patologicos: 'Niega',
        alergicos: 'Niega',
        farmacologicos: 'Niega',
        procedimientos_previos: 'Niega',
      },
      examen_fisico: 'Normal',
      ultimosProcedimientos: ['Toxina Botulínica'],
      procedimiento_realizado: 'Toxina Botulínica',
      lote_producto: 'LOTE-123',
      recomendaciones: 'Evitar masajear la zona por 24 horas',
    },
    soporte_documental: {
      consentimiento_informado: true,
      descargable_consentimiento: 'url',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatientsDomainService,
        {
          provide: PatientsRepository,
          useValue: {
            findAll: vi.fn().mockResolvedValue([mockPatient]),
            findByCedula: vi.fn().mockImplementation((cedula: string) => {
              if (cedula === '1020304050') {
                return Promise.resolve(mockPatient);
              }
              return Promise.resolve(null);
            }),
            create: vi.fn().mockImplementation((data) => {
              return Promise.resolve({
                ...data,
                ultimosProcedimientos: [],
                recomendaciones: '',
              });
            }),
            updateByCedula: vi.fn().mockImplementation((cedula, data) => {
              if (cedula === '1020304050') {
                return Promise.resolve({ ...mockPatient, ...data });
              }
              return Promise.resolve(null);
            }),
          },
        },
        {
          provide: ClinicalRecordsRepository,
          useValue: {
            findByPatientCedula: vi.fn().mockImplementation((cedula: string) => {
              if (cedula === '1020304050') {
                return Promise.resolve([mockClinicalRecord]);
              }
              return Promise.resolve([]);
            }),
          },
        },
        {
          provide: ProfessionalNamesRepository,
          useValue: {
            findFullNameByCedula: vi.fn().mockImplementation((cedula: string) =>
              Promise.resolve(cedula === '71345678' ? 'Carlos Andrés Ruiz' : null)
            ),
          },
        },
      ],
    }).compile();

    service = module.get<PatientsDomainService>(PatientsDomainService);
    patientsRepository = module.get<PatientsRepository>(PatientsRepository);
    clinicalRecordsRepository = module.get<ClinicalRecordsRepository>(ClinicalRecordsRepository);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  it('debe listar todos los pacientes delegando al repositorio', async () => {
    const result = await service.findAllPatients();
    expect(result).toHaveLength(1);
    expect(result[0].cedula).toBe('1020304050');
    expect(patientsRepository.findAll).toHaveBeenCalled();
  });

  it('debe retornar el paciente hidratado con registros clínicos cuando existe', async () => {
    const result = await service.findByNationalId('1020304050');
    expect(result).toBeDefined();
    expect(result.cedula).toBe('1020304050');
    expect(result.recomendaciones).toBe('Evitar masajear la zona por 24 horas');
    expect(result.ultimoMedicoTratante).toBe('Dra. María Gómez');
    expect(result.ultimoMedicoTratanteCedula).toBe('DOC-1');
    expect(result.ultimosProcedimientos).toEqual([
      expect.objectContaining({
        nombre: 'Toxina Botulínica',
        profesional: 'Dra. María Gómez',
      }),
    ]);
    expect(patientsRepository.findByCedula).toHaveBeenCalledWith('1020304050');
    expect(clinicalRecordsRepository.findByPatientCedula).toHaveBeenCalledWith('1020304050');
  });

  it('debe usar la historia COMPLETADA más reciente por fecha de atención e ignorar PENDIENTE_ATENCION', async () => {
    const pendingNewest: ICitaMedica = {
      ...mockClinicalRecord,
      _id: 'rec-pending',
      appointmentId: 'APT-300',
      estado_registro: 'PENDIENTE_ATENCION',
      medico_tratante: [
        { cedula_profesional: 'DOC-3', nombre_profesional: 'Dr. Pendiente', fecha_atencion: new Date('2026-11-10') },
      ],
      registro_clinico: { ...mockClinicalRecord.registro_clinico, recomendaciones: '' },
    };
    const completedOlder: ICitaMedica = {
      ...mockClinicalRecord,
      _id: 'rec-old',
      appointmentId: 'APT-050',
      medico_tratante: [
        { cedula_profesional: 'DOC-0', nombre_profesional: 'Dr. Antiguo', fecha_atencion: new Date('2026-08-01') },
      ],
      registro_clinico: { ...mockClinicalRecord.registro_clinico, recomendaciones: 'Recomendación antigua' },
    };
    vi.mocked(clinicalRecordsRepository.findByPatientCedula).mockResolvedValueOnce([
      pendingNewest,
      completedOlder,
      mockClinicalRecord,
    ]);

    const result = await service.findByNationalId('1020304050');
    expect(result.ultimoMedicoTratante).toBe('Dra. María Gómez');
    expect(result.recomendaciones).toBe('Evitar masajear la zona por 24 horas');
  });

  it('debe resolver el nombre del médico por cédula cuando nombre_profesional viene null', async () => {
    vi.mocked(clinicalRecordsRepository.findByPatientCedula).mockResolvedValueOnce([
      {
        ...mockClinicalRecord,
        medico_tratante: [
          {
            cedula_profesional: '71345678',
            nombre_profesional: null as unknown as undefined,
            fecha_atencion: new Date('2026-10-20'),
          },
        ],
      },
    ]);

    const result = await service.findByNationalId('1020304050');
    expect(result.ultimoMedicoTratante).toBe('Carlos Andrés Ruiz');
  });

  it('debe usar la cédula como último recurso si no se puede resolver el nombre', async () => {
    vi.mocked(clinicalRecordsRepository.findByPatientCedula).mockResolvedValueOnce([
      {
        ...mockClinicalRecord,
        medico_tratante: [
          {
            cedula_profesional: '00000000',
            nombre_profesional: null as unknown as undefined,
            fecha_atencion: new Date('2026-10-20'),
          },
        ],
      },
    ]);

    const result = await service.findByNationalId('1020304050');
    expect(result.ultimoMedicoTratante).toBe('00000000');
  });

  it('no debe retornar médico ni recomendaciones cuando no hay historias COMPLETADA', async () => {
    vi.mocked(clinicalRecordsRepository.findByPatientCedula).mockResolvedValueOnce([
      { ...mockClinicalRecord, estado_registro: 'PENDIENTE_ATENCION' },
    ]);

    const result = await service.findByNationalId('1020304050');
    expect(result.ultimoMedicoTratante).toBeUndefined();
    expect(result.ultimoMedicoTratanteCedula).toBeUndefined();
    expect(result.recomendaciones).toBeUndefined();
  });

  it('debe lanzar RpcException 404 cuando el paciente no existe', async () => {
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

  it('debe registrar un nuevo paciente exitosamente si la cédula no existe', async () => {
    const newPatientData = {
      cedula: '55667788',
      nombre: 'Carlos',
      apellidos: 'Ramírez',
      correo: 'carlos.ramirez@example.com',
      celular: '3151234567',
    };

    const result = await service.createPatient(newPatientData);

    expect(result).toBeDefined();
    expect(result.cedula).toBe('55667788');
    expect(result.nombre).toBe('Carlos');
    expect(patientsRepository.create).toHaveBeenCalledWith(newPatientData);
  });

  it('debe lanzar RpcException 409 si el paciente ya existe al registrarlo', async () => {
    const existingPatientData = {
      cedula: '1020304050',
      nombre: 'Laura Sofía',
      apellidos: 'Gómez',
      correo: 'laura.gomez@example.com',
      celular: '3001234567',
    };

    try {
      await service.createPatient(existingPatientData);
      expect.unreachable('Se esperaba que lanzara RpcException 409');
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(RpcException);
      const rpcError = error as RpcException;
      const errPayload = rpcError.getError();
      expect(errPayload).toEqual(
        expect.objectContaining({
          status: 'error',
          code: 409,
          message: 'El paciente con cédula 1020304050 ya se encuentra registrado',
        })
      );
    }
  });

  it('debe actualizar los datos demográficos del paciente exitosamente', async () => {
    const updateData = {
      ocupacion: 'Ingeniera de Software',
      direccion_residencia: 'Calle 100 # 15-20, Bogotá',
    };

    const result = await service.updatePatient('1020304050', updateData);
    expect(result.ocupacion).toBe('Ingeniera de Software');
    expect(patientsRepository.updateByCedula).toHaveBeenCalledWith('1020304050', updateData);
  });

  it('debe lanzar RpcException 404 si el paciente a actualizar no existe', async () => {
    try {
      await service.updatePatient('9999999999', { ocupacion: 'Médico' });
      expect.unreachable('Se esperaba que lanzara RpcException 404');
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(RpcException);
      const rpcError = error as RpcException;
      const errPayload = rpcError.getError();
      expect(errPayload).toEqual(
        expect.objectContaining({
          status: 'error',
          code: 404,
        })
      );
    }
  });
});
