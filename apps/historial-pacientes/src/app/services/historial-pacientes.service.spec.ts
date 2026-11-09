import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import {
  IActiveProfessional,
  IApiResponse,
  ICitaMedica,
  IPatientHistory,
  IProcedure,
} from '@nx-boilerplate/api-interfaces';
import { ApiClientService } from '@nx-boilerplate/data-access';
import { HISTORIAL_TABS } from '../models/historial-pacientes.models';
import { HistorialPacientesService } from './historial-pacientes.service';

describe('HistorialPacientesService', () => {
  let service: HistorialPacientesService;
  let apiClientMock: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    patch: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  const mockPatient: IPatientHistory = {
    cedula: '12345678',
    tipo_documento: 'CC',
    nombre: 'Ana',
    apellidos: 'Gómez',
    correo: 'ana@example.com',
    celular: '3001234567',
    fecha_nacimiento: '1990-05-15',
    sexo: 'Femenino',
    estado_civil: 'Soltero(a)',
    ocupacion: 'Ingeniera',
    direccion_residencia: 'Calle 100 # 15-20',
    aseguradora: 'Sura EPS',
    tipo_vinculacion: 'Cotizante',
    es_menor_de_edad: false,
    acompanante: { nombre: 'Carlos Gómez', telefono: '3009876543' },
    persona_responsable: { nombre: null, telefono: null, parentesco: null },
    ultimosProcedimientos: [],
  };

  const mockDoctor: IActiveProfessional = {
    cedula: '98765432',
    nombres: 'María',
    apellidos: 'Pérez',
    email: 'maria.perez@clinica.com',
    profesion: 'Dermatóloga',
    horarioTrabajo: {
      diasLaborales: ['Lunes', 'Miércoles'],
      horaInicio: '08:00',
      horaFin: '17:00',
    },
  };

  const mockProcedure: IProcedure = {
    idProcedimiento: 'proc-1',
    nombreProcedimiento: 'Limpieza Facial Profunda',
    valorStandar: 120000,
    duracionStandar: 60,
    medicosRelacionados: ['98765432'],
  };

  const mockClinicalRecord: ICitaMedica = {
    _id: 'rec-1',
    appointmentId: 'c-100',
    cedula_paciente: '12345678',
    estado_registro: 'COMPLETADA',
    medico_tratante: [
      {
        nombre_profesional: 'María Pérez',
        cedula_profesional: '98765432',
        fecha_atencion: '2026-03-10',
      },
    ],
    registro_clinico: {
      motivo_consulta: 'Revisión anual',
      enfermedad_actual: 'Ninguna',
      antecedentes_medicos: {
        patologicos: 'Ninguno',
        alergicos: 'Ninguno',
        farmacologicos: 'Ninguno',
        procedimientos_previos: 'Ninguno',
      },
      examen_fisico: 'Piel hidratada',
      procedimiento_realizado: 'Limpieza Facial Profunda',
      lote_producto: 'L-2026-01',
      recomendaciones: 'Usar protector solar',
    },
    soporte_documental: {
      consentimiento_informado: true,
      descargable_consentimiento: 'https://cdn.example.com/consent.pdf',
    },
  };

  beforeEach(() => {
    apiClientMock = {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        HistorialPacientesService,
        { provide: ApiClientService, useValue: apiClientMock },
      ],
    });

    service = TestBed.inject(HistorialPacientesService);
  });

  it('should initialize with default empty states and DIRECTORY active tab', () => {
    expect(service.patientsList()).toEqual([]);
    expect(service.selectedPatient()).toBeNull();
    expect(service.clinicalRecords()).toEqual([]);
    expect(service.doctors()).toEqual([]);
    expect(service.procedures()).toEqual([]);
    expect(service.activeTab()).toBe(HISTORIAL_TABS.DIRECTORY);
    expect(service.isLoading()).toBe(false);
    expect(service.hasSelectedPatient()).toBe(false);
  });

  describe('loadPatients', () => {
    it('should fetch patients and populate patientsList signal', () => {
      const response: IApiResponse<IPatientHistory[]> = {
        success: true,
        statusCode: 200,
        message: 'Pacientes listados',
        data: [mockPatient],
      };
      apiClientMock.get.mockReturnValue(of(response));

      service.loadPatients();

      expect(apiClientMock.get).toHaveBeenCalledWith('/api/patients');
      expect(service.patientsList()).toEqual([mockPatient]);
      expect(service.isLoading()).toBe(false);
      expect(service.error()).toBeNull();
    });

    it('should handle errors gracefully and set error signal', () => {
      apiClientMock.get.mockReturnValue(
        throwError(() => new Error('Network error'))
      );

      service.loadPatients();

      expect(service.patientsList()).toEqual([]);
      expect(service.error()).toBe('No se pudo cargar la lista de pacientes.');
      expect(service.isLoading()).toBe(false);
    });
  });

  describe('loadDoctors and loadProcedures', () => {
    it('should load doctors successfully', () => {
      const response: IApiResponse<IActiveProfessional[]> = {
        success: true,
        statusCode: 200,
        message: 'Doctores listados',
        data: [mockDoctor],
      };
      apiClientMock.get.mockReturnValue(of(response));

      service.loadDoctors();

      expect(apiClientMock.get).toHaveBeenCalledWith('/api/doctors', {
        params: { includeInactive: 'true' },
      });
      expect(service.doctors()).toEqual([mockDoctor]);
    });

    it('should load procedures successfully', () => {
      const response: IApiResponse<IProcedure[]> = {
        success: true,
        statusCode: 200,
        message: 'Procedimientos listados',
        data: [mockProcedure],
      };
      apiClientMock.get.mockReturnValue(of(response));

      service.loadProcedures();

      expect(apiClientMock.get).toHaveBeenCalledWith('/api/procedures');
      expect(service.procedures()).toEqual([mockProcedure]);
    });
  });

  describe('directoryRows and clinicalRecordRows computeds', () => {
    it('should compute directoryRows with age and demographic completeness', () => {
      const response: IApiResponse<IPatientHistory[]> = {
        success: true,
        statusCode: 200,
        message: 'Pacientes',
        data: [mockPatient],
      };
      apiClientMock.get.mockReturnValue(of(response));
      service.loadPatients();

      const rows = service.directoryRows();
      expect(rows.length).toBe(1);
      expect(rows[0].cedula).toBe('12345678');
      expect(rows[0].nombreCompleto).toBe('Ana Gómez');
      expect(rows[0].estadoFicha).toBe('COMPLETA');
      expect(rows[0].edad).toBeGreaterThan(0);
    });

    it('should compute clinicalRecordRows with resolved doctor name and row identifiers', () => {
      // First load doctors
      apiClientMock.get.mockReturnValueOnce(
        of({ success: true, statusCode: 200, message: '', data: [mockDoctor] })
      );
      service.loadDoctors();

      // Next simulate selectAndLoadPatientExpediente
      apiClientMock.get.mockImplementation((url: string) => {
        if (url.includes('/clinical-records')) {
          return of({
            success: true,
            statusCode: 200,
            message: '',
            data: [mockClinicalRecord],
          });
        }
        return of({
          success: true,
          statusCode: 200,
          message: '',
          data: mockPatient,
        });
      });

      service.selectAndLoadPatientExpediente('12345678');

      const rows = service.clinicalRecordRows();
      expect(rows.length).toBe(1);
      expect(rows[0].id).toBe('rec-1');
      expect(rows[0].appointmentIdDisplay).toBe('c-100');
      expect(rows[0].medicoNombre).toBe('María Pérez');
      expect(rows[0].estadoRegistroLabel).toBe('Completada');
      expect(rows[0].procedimientoRealizado).toBe('Limpieza Facial Profunda');
    });
  });

  describe('selectAndLoadPatientExpediente and clearSelectedPatient', () => {
    it('should load patient and records concurrently and switch tab to EXPEDIENTE', () => {
      apiClientMock.get.mockImplementation((url: string) => {
        if (url.endsWith('/clinical-records')) {
          return of({
            success: true,
            statusCode: 200,
            message: '',
            data: [mockClinicalRecord],
          });
        }
        return of({
          success: true,
          statusCode: 200,
          message: '',
          data: mockPatient,
        });
      });

      service.selectAndLoadPatientExpediente('12345678');

      expect(service.selectedPatient()).toEqual(mockPatient);
      expect(service.clinicalRecords()).toEqual([mockClinicalRecord]);
      expect(service.activeTab()).toBe(HISTORIAL_TABS.EXPEDIENTE);
      expect(service.hasSelectedPatient()).toBe(true);
    });

    it('should clear selection and reset active tab to DIRECTORY', () => {
      service.setSelectedPatient(mockPatient);
      service.setActiveTab(HISTORIAL_TABS.EXPEDIENTE);

      service.clearSelectedPatient();

      expect(service.selectedPatient()).toBeNull();
      expect(service.clinicalRecords()).toEqual([]);
      expect(service.activeTab()).toBe(HISTORIAL_TABS.DIRECTORY);
      expect(service.hasSelectedPatient()).toBe(false);
    });
  });

  describe('mutations: createPatient, updatePatient, createClinicalRecord, updateClinicalRecord', () => {
    it('should create patient and prepend to patientsList', () => {
      const newPatient: IPatientHistory = {
        ...mockPatient,
        cedula: '87654321',
        nombre: 'Pedro',
      };
      apiClientMock.post.mockReturnValue(
        of({ success: true, statusCode: 201, message: '', data: newPatient })
      );

      service.createPatient(newPatient).subscribe((result) => {
        expect(result).toEqual(newPatient);
      });

      expect(service.patientsList()).toContainEqual(newPatient);
      expect(service.isSaving()).toBe(false);
    });

    it('should update patient and refresh patientsList and selectedPatient', () => {
      // Setup initial list and selected via loadPatients
      apiClientMock.get.mockReturnValueOnce(
        of({ success: true, statusCode: 200, message: '', data: [mockPatient] })
      );
      service.loadPatients();
      service.setSelectedPatient(mockPatient);

      const updatedPatient: IPatientHistory = {
        ...mockPatient,
        celular: '3119999999',
      };
      apiClientMock.patch.mockReturnValue(
        of({ success: true, statusCode: 200, message: '', data: updatedPatient })
      );

      service
        .updatePatient('12345678', { celular: '3119999999' })
        .subscribe((result) => {
          expect(result.celular).toBe('3119999999');
        });

      expect(service.selectedPatient()?.celular).toBe('3119999999');
      expect(service.patientsList()[0]?.celular).toBe('3119999999');
    });

    it('should create clinical record and prepend to clinicalRecords', () => {
      apiClientMock.post.mockReturnValue(
        of({
          success: true,
          statusCode: 201,
          message: '',
          data: mockClinicalRecord,
        })
      );

      service
        .createClinicalRecord({
          cedula_paciente: '12345678',
          medico_tratante: mockClinicalRecord.medico_tratante,
          registro_clinico: mockClinicalRecord.registro_clinico,
        })
        .subscribe((rec) => {
          expect(rec).toEqual(mockClinicalRecord);
        });

      expect(service.clinicalRecords()).toContainEqual(mockClinicalRecord);
    });

    it('should update clinical record and update in clinicalRecords', () => {
      // Add initial record
      apiClientMock.post.mockReturnValue(
        of({
          success: true,
          statusCode: 201,
          message: '',
          data: mockClinicalRecord,
        })
      );
      service
        .createClinicalRecord({
          cedula_paciente: '12345678',
          medico_tratante: mockClinicalRecord.medico_tratante,
          registro_clinico: mockClinicalRecord.registro_clinico,
        })
        .subscribe();

      const updatedRecord: ICitaMedica = {
        ...mockClinicalRecord,
        estado_registro: 'COMPLETADA',
      };
      apiClientMock.patch.mockReturnValue(
        of({
          success: true,
          statusCode: 200,
          message: '',
          data: updatedRecord,
        })
      );

      service
        .updateClinicalRecord('rec-1', { estado_registro: 'COMPLETADA' })
        .subscribe((res) => {
          expect(res.estado_registro).toBe('COMPLETADA');
        });

      expect(service.clinicalRecords()[0].estado_registro).toBe('COMPLETADA');
    });
  });

  describe('resolvers: resolveDoctorName and resolveProcedureName', () => {
    it('should resolve doctor name by cedula when doctor exists in list', () => {
      apiClientMock.get.mockReturnValue(
        of({ success: true, statusCode: 200, message: '', data: [mockDoctor] })
      );
      service.loadDoctors();

      expect(service.resolveDoctorName('98765432')).toBe('María Pérez');
    });

    it('should fallback when doctor is not found', () => {
      expect(service.resolveDoctorName('00000', 'Dr. Default')).toBe(
        'Dr. Default'
      );
      expect(service.resolveDoctorName(null)).toBe('No asignado');
    });

    it('should resolve procedure name when procedure exists in list', () => {
      apiClientMock.get.mockReturnValue(
        of({ success: true, statusCode: 200, message: '', data: [mockProcedure] })
      );
      service.loadProcedures();

      expect(service.resolveProcedureName('proc-1')).toBe(
        'Limpieza Facial Profunda'
      );
    });

    it('should fallback when procedure is not found', () => {
      expect(service.resolveProcedureName('proc-99', 'Procedimiento X')).toBe(
        'Procedimiento X'
      );
      expect(service.resolveProcedureName(null)).toBe('No asignado');
    });
  });
});
