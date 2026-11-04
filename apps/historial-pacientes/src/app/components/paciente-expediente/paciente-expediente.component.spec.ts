import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import {
  AsideModalService,
  ConfirmationModalComponent,
} from '@nx-boilerplate/layouts';
import {
  IClinicalRecordRow,
  IPatientHistory,
} from '@nx-boilerplate/api-interfaces';
import { HistorialPacientesService } from '../../services/historial-pacientes.service';
import { ClinicalRecordDetailComponent } from '../clinical-record-detail/clinical-record-detail.component';
import { ClinicalRecordFormComponent } from '../clinical-record-form/clinical-record-form.component';
import { PacienteExpedienteComponent } from './paciente-expediente.component';

describe('PacienteExpedienteComponent', () => {
  let component: PacienteExpedienteComponent;
  let fixture: ComponentFixture<PacienteExpedienteComponent>;
  let mockHistorialService: {
    selectedPatient: ReturnType<typeof signal<IPatientHistory | null>>;
    clinicalRecordRows: ReturnType<typeof signal<IClinicalRecordRow[]>>;
    isLoadingRecords: ReturnType<typeof signal<boolean>>;
    clearSelectedPatient: ReturnType<typeof vi.fn>;
    loadPatients: ReturnType<typeof vi.fn>;
  };
  let mockDialog: {
    open: ReturnType<typeof vi.fn>;
  };
  let mockAsideModalService: {
    open: ReturnType<typeof vi.fn>;
  };

  const samplePatient: IPatientHistory = {
    cedula: '1020304050',
    tipo_documento: 'CC',
    nombre: 'Carlos',
    apellidos: 'Duarte',
    correo: 'carlos@example.com',
    celular: '3112223344',
    fecha_nacimiento: '1985-04-20',
    edad: 40,
    sexo: 'Masculino',
    direccion_residencia: 'Calle 50 # 10-20',
    aseguradora: 'Sanitas EPS',
    tipo_vinculacion: 'Cotizante',
    es_menor_de_edad: false,
    ultimosProcedimientos: [],
  };

  const sampleRecordRow: IClinicalRecordRow = {
    id: 'rec-001',
    appointmentIdDisplay: 'c-50',
    fechaAtencion: '2026-03-01',
    procedimientoRealizado: 'Consulta Dermatológica',
    medicoCedula: '98765432',
    medicoNombre: 'Dra. María Pérez',
    estadoRegistro: 'COMPLETADA',
    estadoRegistroLabel: 'Completada',
    raw: {
      appointmentId: 'c-50',
      cedula_paciente: '1020304050',
      estado_registro: 'COMPLETADA',
      medico_tratante: [
        {
          cedula_profesional: '98765432',
          nombre_profesional: 'Dra. María Pérez',
          fecha_atencion: '2026-03-01',
        },
      ],
      registro_clinico: {
        motivo_consulta: 'Revisión',
        enfermedad_actual: 'Ninguna',
        antecedentes_medicos: {
          patologicos: 'Ninguno',
          alergicos: 'Ninguno',
          farmacologicos: 'Ninguno',
          procedimientos_previos: 'Ninguno',
        },
        examen_fisico: 'Normal',
        procedimiento_realizado: 'Consulta Dermatológica',
        lote_producto: 'N/A',
        recomendaciones: 'Protector solar',
      },
      soporte_documental: {
        consentimiento_informado: true,
        descargable_consentimiento: 'https://docs.clinica.com/c-50.pdf',
      },
    },
  };

  beforeEach(async () => {
    mockHistorialService = {
      selectedPatient: signal<IPatientHistory | null>(null),
      clinicalRecordRows: signal<IClinicalRecordRow[]>([]),
      isLoadingRecords: signal<boolean>(false),
      clearSelectedPatient: vi.fn(),
      loadPatients: vi.fn(),
    };
    mockDialog = {
      open: vi.fn(),
    };
    mockAsideModalService = {
      open: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [PacienteExpedienteComponent],
      providers: [
        provideNoopAnimations(),
        { provide: HistorialPacientesService, useValue: mockHistorialService },
        { provide: MatDialog, useValue: mockDialog },
        { provide: AsideModalService, useValue: mockAsideModalService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PacienteExpedienteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should render empty state when no patient is selected', () => {
    expect(component).toBeTruthy();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.empty-expediente')).toBeTruthy();
  });

  it('should call clearSelectedPatient when returning to directory', () => {
    component.onVolverAlDirectorio();
    expect(mockHistorialService.clearSelectedPatient).toHaveBeenCalled();
  });

  describe('with selected patient', () => {
    beforeEach(() => {
      mockHistorialService.selectedPatient.set(samplePatient);
      mockHistorialService.clinicalRecordRows.set([sampleRecordRow]);
      fixture.detectChanges();
    });

    it('should render patient header and records table', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.patient-hero-card')).toBeTruthy();
      expect(compiled.querySelector('.patient-name')?.textContent).toContain(
        'Carlos Duarte'
      );
    });

    it('should open ClinicalRecordDetailComponent on view-record action', () => {
      component.onTableAction({
        action: 'view-record',
        row: sampleRecordRow,
      });

      expect(mockAsideModalService.open).toHaveBeenCalledWith(
        expect.objectContaining({
          component: ClinicalRecordDetailComponent,
          showActions: false,
        }),
        expect.objectContaining({
          width: '560px',
        })
      );
    });

    it('should open ClinicalRecordFormComponent on edit-record action', () => {
      component.onTableAction({
        action: 'edit-record',
        row: sampleRecordRow,
      });

      expect(mockAsideModalService.open).toHaveBeenCalledWith(
        expect.objectContaining({
          component: ClinicalRecordFormComponent,
          showActions: false,
        }),
        expect.objectContaining({
          width: '680px',
        })
      );
    });

    it('should confirm and open ClinicalRecordFormComponent for manual creation', () => {
      mockDialog.open.mockReturnValue({
        afterClosed: () => of(true),
      });

      component.onNuevaAtencionManual();

      expect(mockDialog.open).toHaveBeenCalledWith(
        ConfirmationModalComponent,
        expect.anything()
      );
      expect(mockAsideModalService.open).toHaveBeenCalledWith(
        expect.objectContaining({
          component: ClinicalRecordFormComponent,
          inputs: expect.objectContaining({
            record: null,
            patient: samplePatient,
          }),
        }),
        expect.anything()
      );
    });
  });
});

