import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';
import { IPatientHistory } from '@nx-boilerplate/api-interfaces';
import {
  HISTORIAL_TABS,
  HistorialTabId,
} from '../models/historial-pacientes.models';
import { HistorialPacientesService } from '../services/historial-pacientes.service';
import { RemoteEntryComponent } from './remote-entry.component';

describe('RemoteEntryComponent', () => {
  let component: RemoteEntryComponent;
  let fixture: ComponentFixture<RemoteEntryComponent>;
  let mockHistorialService: {
    activeTab: ReturnType<typeof signal<HistorialTabId>>;
    selectedPatient: ReturnType<typeof signal<IPatientHistory | null>>;
    hasSelectedPatient: ReturnType<typeof signal<boolean>>;
    loadPatients: ReturnType<typeof vi.fn>;
    loadDoctors: ReturnType<typeof vi.fn>;
    loadProcedures: ReturnType<typeof vi.fn>;
    clearSelectedPatient: ReturnType<typeof vi.fn>;
    setActiveTab: ReturnType<typeof vi.fn>;
    directoryRows: ReturnType<typeof signal<unknown[]>>;
    clinicalRecordRows: ReturnType<typeof signal<unknown[]>>;
    isLoading: ReturnType<typeof signal<boolean>>;
    isLoadingRecords: ReturnType<typeof signal<boolean>>;
  };

  beforeEach(async () => {
    mockHistorialService = {
      activeTab: signal<HistorialTabId>(HISTORIAL_TABS.DIRECTORY),
      selectedPatient: signal<IPatientHistory | null>(null),
      hasSelectedPatient: signal<boolean>(false),
      loadPatients: vi.fn(),
      loadDoctors: vi.fn(),
      loadProcedures: vi.fn(),
      clearSelectedPatient: vi.fn(),
      setActiveTab: vi.fn(),
      directoryRows: signal([]),
      clinicalRecordRows: signal([]),
      isLoading: signal(false),
      isLoadingRecords: signal(false),
    };

    await TestBed.configureTestingModule({
      imports: [RemoteEntryComponent],
      providers: [
        provideNoopAnimations(),
        { provide: HistorialPacientesService, useValue: mockHistorialService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RemoteEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse e inicializar la carga de pacientes, doctores y procedimientos, reseteando paciente previo', () => {
    expect(component).toBeTruthy();
    expect(mockHistorialService.clearSelectedPatient).toHaveBeenCalled();
    expect(mockHistorialService.loadPatients).toHaveBeenCalled();
    expect(mockHistorialService.loadDoctors).toHaveBeenCalled();
    expect(mockHistorialService.loadProcedures).toHaveBeenCalled();
  });

  it('debe invocar clearSelectedPatient al destruirse el componente', () => {
    mockHistorialService.clearSelectedPatient.mockClear();
    component.ngOnDestroy();
    expect(mockHistorialService.clearSelectedPatient).toHaveBeenCalledTimes(1);
  });

  it('debe configurar 2 pestañas y actualizar el label del expediente dinámicamente', () => {
    const tabs = component.tabs();
    expect(tabs.length).toBe(2);
    expect(tabs[0].label).toBe('Directorio de Pacientes');
    expect(tabs[1].label).toBe('Expediente Clínico');

    // Simular selección de paciente
    mockHistorialService.selectedPatient.set({
      cedula: '12345678',
      nombre: 'Lucía',
      apellidos: 'Mora',
      correo: 'lucia@example.com',
      celular: '3001112233',
    });

    const updatedTabs = component.tabs();
    expect(updatedTabs[1].label).toBe('Expediente: Lucía Mora');
  });

  it('debe cambiar la pestaña activa cuando onActiveTabChange es invocado', () => {
    component.onActiveTabChange(HISTORIAL_TABS.EXPEDIENTE);
    expect(mockHistorialService.setActiveTab).toHaveBeenCalledWith(
      HISTORIAL_TABS.EXPEDIENTE
    );
  });
});
