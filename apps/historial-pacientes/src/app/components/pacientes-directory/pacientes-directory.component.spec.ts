import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import {
  AsideModalService,
  ConfirmationModalComponent,
} from '@nx-boilerplate/layouts';
import { IPatientDirectoryRow } from '../../models/historial-pacientes.models';
import { HistorialPacientesService } from '../../services/historial-pacientes.service';
import { PacienteDemographicFormComponent } from '../paciente-demographic-form/paciente-demographic-form.component';
import { PacientesDirectoryComponent } from './pacientes-directory.component';

describe('PacientesDirectoryComponent', () => {
  let component: PacientesDirectoryComponent;
  let fixture: ComponentFixture<PacientesDirectoryComponent>;
  let mockHistorialService: {
    directoryRows: ReturnType<typeof signal<IPatientDirectoryRow[]>>;
    isLoading: ReturnType<typeof signal<boolean>>;
    selectAndLoadPatientExpediente: ReturnType<typeof vi.fn>;
    loadPatients: ReturnType<typeof vi.fn>;
  };
  let mockDialog: {
    open: ReturnType<typeof vi.fn>;
  };
  let mockAsideModalService: {
    open: ReturnType<typeof vi.fn>;
  };

  const sampleRow: IPatientDirectoryRow = {
    cedula: '12345678',
    tipo_documento: 'CC',
    nombre: 'Ana',
    apellidos: 'Gómez',
    nombreCompleto: 'Ana Gómez',
    correo: 'ana@example.com',
    celular: '3001234567',
    edad: 34,
    estadoFicha: 'COMPLETA',
    estadoFichaLabel: 'Completa',
    raw: {
      cedula: '12345678',
      tipo_documento: 'CC',
      nombre: 'Ana',
      apellidos: 'Gómez',
      correo: 'ana@example.com',
      celular: '3001234567',
      ultimosProcedimientos: [],
    },
  };

  beforeEach(async () => {
    mockHistorialService = {
      directoryRows: signal<IPatientDirectoryRow[]>([sampleRow]),
      isLoading: signal<boolean>(false),
      selectAndLoadPatientExpediente: vi.fn(),
      loadPatients: vi.fn(),
    };
    mockDialog = {
      open: vi.fn(),
    };
    mockAsideModalService = {
      open: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [PacientesDirectoryComponent],
      providers: [
        provideNoopAnimations(),
        { provide: HistorialPacientesService, useValue: mockHistorialService },
        { provide: MatDialog, useValue: mockDialog },
        { provide: AsideModalService, useValue: mockAsideModalService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PacientesDirectoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and display directory table with rows', () => {
    expect(component).toBeTruthy();
    expect(component.columns.length).toBe(6);
  });

  it('should trigger selectAndLoadPatientExpediente when clicking view-expediente action', () => {
    component.onTableAction({
      action: 'view-expediente',
      row: sampleRow,
    });

    expect(
      mockHistorialService.selectAndLoadPatientExpediente
    ).toHaveBeenCalledWith('12345678');
  });

  it('should trigger selectAndLoadPatientExpediente on row click', () => {
    component.onRowClick(sampleRow);

    expect(
      mockHistorialService.selectAndLoadPatientExpediente
    ).toHaveBeenCalledWith('12345678');
  });

  it('should open ConfirmationModal when clicking Agregar Paciente, and open AsideModal upon confirmation', () => {
    mockDialog.open.mockReturnValue({
      afterClosed: () => of(true),
    });
    mockAsideModalService.open.mockReturnValue({
      afterClosed: () => of(sampleRow.raw),
    });

    component.onAgregarPaciente();

    expect(mockDialog.open).toHaveBeenCalledWith(ConfirmationModalComponent, {
      data: expect.objectContaining({
        title: 'Registrar Paciente sin Cita Previa',
      }),
      width: '450px',
      disableClose: false,
    });

    expect(mockAsideModalService.open).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Registrar Nuevo Paciente (Sin Cita Previa)',
        component: PacienteDemographicFormComponent,
        showActions: false,
        showCloseIcon: true,
      }),
      expect.objectContaining({
        width: '680px',
      })
    );
  });

  it('should not open AsideModal when ConfirmationModal is cancelled', () => {
    mockDialog.open.mockReturnValue({
      afterClosed: () => of(false),
    });

    component.onAgregarPaciente();

    expect(mockDialog.open).toHaveBeenCalled();
    expect(mockAsideModalService.open).not.toHaveBeenCalled();
  });
});

