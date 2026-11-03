import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { RpcException } from '@nestjs/microservices';
import {
  IAppointmentConfirmedEvent,
  ICitaMedica,
  ICreateClinicalRecordRequest,
  IUpdateClinicalRecordRequest,
} from '@nx-boilerplate/api-interfaces';
import { ClinicalRecordsDomainService } from './clinical-records-domain.service';
import { ClinicalRecordsRepository } from '../repositories/clinical-records.repository';

describe('ClinicalRecordsDomainService', () => {
  let service: ClinicalRecordsDomainService;
  let repository: ClinicalRecordsRepository;

  const mockRecord: ICitaMedica = {
    _id: 'rec-123',
    appointmentId: 'APT-1761844800000-1',
    cedula_paciente: '1017187698',
    estado_registro: 'PENDIENTE_ATENCION',
    medico_tratante: [
      {
        cedula_profesional: '1018432109',
        nombre_profesional: 'Dr. Camilo Tabares',
        fecha_atencion: new Date('2026-11-10T10:00:00Z'),
      },
    ],
    registro_clinico: {
      motivo_consulta: 'Atención programada para: Toxina Botulínica',
      enfermedad_actual: '',
      antecedentes_medicos: {
        patologicos: 'Niega',
        alergicos: 'Niega',
        farmacologicos: 'Niega',
        procedimientos_previos: 'Niega',
      },
      examen_fisico: '',
      ultimosProcedimientos: ['Toxina Botulínica'],
      procedimiento_realizado: 'Toxina Botulínica',
      lote_producto: null,
      recomendaciones: '',
    },
    soporte_documental: {
      consentimiento_informado: false,
      descargable_consentimiento: '',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClinicalRecordsDomainService,
        {
          provide: ClinicalRecordsRepository,
          useValue: {
            createDraftFromAppointment: vi.fn().mockResolvedValue(mockRecord),
            findByPatientCedula: vi.fn().mockImplementation((cedula: string) => {
              if (cedula === '1017187698') {
                return Promise.resolve([mockRecord]);
              }
              return Promise.resolve([]);
            }),
            findById: vi.fn().mockImplementation((id: string) => {
              if (id === 'rec-123' || id === 'APT-1761844800000-1') {
                return Promise.resolve(mockRecord);
              }
              return Promise.resolve(null);
            }),
            create: vi.fn().mockImplementation((data) => {
              return Promise.resolve({
                ...data,
                _id: 'rec-new',
              });
            }),
            update: vi.fn().mockImplementation((id, data) => {
              if (id === 'rec-123') {
                return Promise.resolve({
                  ...mockRecord,
                  ...data,
                  registro_clinico: {
                    ...mockRecord.registro_clinico,
                    ...(data.registro_clinico || {}),
                  },
                });
              }
              return Promise.resolve(null);
            }),
          },
        },
      ],
    }).compile();

    service = module.get<ClinicalRecordsDomainService>(ClinicalRecordsDomainService);
    repository = module.get<ClinicalRecordsRepository>(ClinicalRecordsRepository);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  it('debe inicializar un borrador clínico a partir de una cita confirmada', async () => {
    const event: IAppointmentConfirmedEvent = {
      appointmentId: 'APT-1761844800000-1',
      patientNationalId: '1017187698',
      doctorCedula: '1018432109',
      procedureId: 'PROC-1',
      procedureName: 'Toxina Botulínica',
      appointmentDate: '2026-11-10T10:00:00.000Z',
    };

    const result = await service.initializeDraftFromConfirmedAppointment(event);

    expect(result).toBeDefined();
    expect(result.appointmentId).toBe('APT-1761844800000-1');
    expect(result.estado_registro).toBe('PENDIENTE_ATENCION');
    expect(repository.createDraftFromAppointment).toHaveBeenCalledWith(event);
  });

  it('debe consultar el historial clínico por cédula de paciente', async () => {
    const records = await service.getPatientClinicalHistory('1017187698');
    expect(records).toHaveLength(1);
    expect(records[0].cedula_paciente).toBe('1017187698');
    expect(repository.findByPatientCedula).toHaveBeenCalledWith('1017187698');
  });

  it('debe consultar una atención médica por su id', async () => {
    const record = await service.getClinicalRecordById('rec-123');
    expect(record).toBeDefined();
    expect(record._id).toBe('rec-123');
    expect(repository.findById).toHaveBeenCalledWith('rec-123');
  });

  it('debe lanzar RpcException 404 si la atención médica no existe', async () => {
    try {
      await service.getClinicalRecordById('inexistente');
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

  it('debe crear una atención médica manualmente', async () => {
    const createData: ICreateClinicalRecordRequest = {
      cedula_paciente: '1017187698',
      medico_tratante: [
        {
          cedula_profesional: '1018432109',
          fecha_atencion: new Date(),
        },
      ],
      registro_clinico: {
        motivo_consulta: 'Consulta directa',
        enfermedad_actual: 'Ninguna',
        antecedentes_medicos: {
          patologicos: 'Niega',
          alergicos: 'Niega',
          farmacologicos: 'Niega',
          procedimientos_previos: 'Niega',
        },
        examen_fisico: 'Piel sana',
        procedimiento_realizado: 'Valoración',
        lote_producto: null,
        recomendaciones: 'Control en 6 meses',
      },
    };

    const result = await service.createClinicalRecord(createData);
    expect(result).toBeDefined();
    expect(repository.create).toHaveBeenCalledWith(createData);
  });

  it('debe actualizar una atención médica existente y completar el registro', async () => {
    const updateData: IUpdateClinicalRecordRequest = {
      estado_registro: 'COMPLETADA',
      registro_clinico: {
        examen_fisico: 'Piel hidratada sin hematomas',
        recomendaciones: 'Protector solar cada 4 horas',
      },
    };

    const result = await service.updateClinicalRecord('rec-123', updateData);
    expect(result.estado_registro).toBe('COMPLETADA');
    expect(result.registro_clinico.examen_fisico).toBe('Piel hidratada sin hematomas');
    expect(repository.update).toHaveBeenCalledWith('rec-123', updateData);
  });

  it('debe lanzar RpcException 404 al intentar actualizar una atención inexistente', async () => {
    try {
      await service.updateClinicalRecord('inexistente', { estado_registro: 'COMPLETADA' });
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

