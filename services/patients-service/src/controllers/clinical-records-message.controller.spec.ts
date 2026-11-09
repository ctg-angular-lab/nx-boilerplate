import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { ClinicalRecordsMessageController } from './clinical-records-message.controller';
import { ClinicalRecordsDomainService } from '@nx-boilerplate/backend/patients-domain';
import { ICitaMedica } from '@nx-boilerplate/api-interfaces';

describe('ClinicalRecordsMessageController', () => {
  let controller: ClinicalRecordsMessageController;
  let service: ClinicalRecordsDomainService;

  const mockRecord: ICitaMedica = {
    _id: 'rec-1',
    appointmentId: 'APT-1',
    cedula_paciente: '1017187698',
    estado_registro: 'PENDIENTE_ATENCION',
    medico_tratante: [
      {
        cedula_profesional: 'DOC-1',
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
      controllers: [ClinicalRecordsMessageController],
      providers: [
        {
          provide: ClinicalRecordsDomainService,
          useValue: {
            initializeDraftFromConfirmedAppointment: vi.fn().mockResolvedValue(mockRecord),
            getPatientClinicalHistory: vi.fn().mockResolvedValue([mockRecord]),
            getClinicalRecordById: vi.fn().mockResolvedValue(mockRecord),
            createClinicalRecord: vi.fn().mockResolvedValue(mockRecord),
            updateClinicalRecord: vi.fn().mockResolvedValue({
              ...mockRecord,
              estado_registro: 'COMPLETADA',
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<ClinicalRecordsMessageController>(ClinicalRecordsMessageController);
    service = module.get<ClinicalRecordsDomainService>(ClinicalRecordsDomainService);
  });

  it('debe estar definido', () => {
    expect(controller).toBeDefined();
  });

  it('debe manejar el evento de cita confirmada e inicializar el borrador clínico', async () => {
    const eventPayload = {
      appointmentId: 'APT-1',
      patientNationalId: '1017187698',
      doctorCedula: 'DOC-1',
      procedureId: 'PROC-1',
      procedureName: 'Toxina Botulínica',
      appointmentDate: '2026-11-10T10:00:00Z',
    };

    await controller.handleAppointmentConfirmed(eventPayload);

    expect(service.initializeDraftFromConfirmedAppointment).toHaveBeenCalledWith(eventPayload);
  });

  it('debe consultar las historias clínicas por cédula de paciente', async () => {
    const result = await controller.findByPatient({ nationalId: '1017187698' });

    expect(service.getPatientClinicalHistory).toHaveBeenCalledWith('1017187698');
    expect(result).toHaveLength(1);
    expect(result[0].cedula_paciente).toBe('1017187698');
  });

  it('debe consultar una historia clínica por su ID', async () => {
    const result = await controller.findById({ id: 'rec-1' });

    expect(service.getClinicalRecordById).toHaveBeenCalledWith('rec-1');
    expect(result._id).toBe('rec-1');
  });

  it('debe delegar la creación de una atención clínica directa', async () => {
    const payload = {
      cedula_paciente: '1017187698',
      medico_tratante: mockRecord.medico_tratante,
      registro_clinico: mockRecord.registro_clinico,
    };

    const result = await controller.create(payload);

    expect(service.createClinicalRecord).toHaveBeenCalledWith(payload);
    expect(result).toEqual(mockRecord);
  });

  it('debe delegar la actualización de una atención clínica', async () => {
    const payload = {
      id: 'rec-1',
      data: {
        estado_registro: 'COMPLETADA' as const,
      },
    };

    const result = await controller.update(payload);

    expect(service.updateClinicalRecord).toHaveBeenCalledWith('rec-1', {
      estado_registro: 'COMPLETADA',
    });
    expect(result.estado_registro).toBe('COMPLETADA');
  });
});

