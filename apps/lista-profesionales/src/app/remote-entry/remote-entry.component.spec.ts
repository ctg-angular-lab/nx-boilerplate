import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { signal, WritableSignal } from '@angular/core';
import { IActiveProfessional, IProcedure } from '@nx-boilerplate/api-interfaces';
import { TabsCollectionComponent } from '@nx-boilerplate/layouts';
import {
  PROFESIONALES_TABS,
  ProfesionalesTabId,
} from '../models/profesionales-nav.models';
import { ProfesionalesAdminService } from '../services/profesionales-admin.service';
import { RemoteEntryComponent } from './remote-entry.component';

const mockProfessional: IActiveProfessional = {
  cedula: '12345678',
  nombres: 'Laura',
  apellidos: 'Gómez',
  email: 'laura.gomez@clinica.com',
  profesion: 'Médica General',
  isActive: true,
  horarioTrabajo: {
    diasLaborales: ['LUNES', 'MIERCOLES'],
    horaInicio: '08:00',
    horaFin: '17:00',
  },
};

describe('RemoteEntryComponent (Tab Host)', () => {
  let component: RemoteEntryComponent;
  let fixture: ComponentFixture<RemoteEntryComponent>;

  let mockActiveTabSignal: WritableSignal<ProfesionalesTabId>;
  let mockEditingProfessionalSignal: WritableSignal<IActiveProfessional | null>;
  let mockService: {
    activeTab: WritableSignal<ProfesionalesTabId>;
    editingProfessional: WritableSignal<IActiveProfessional | null>;
    isEditMode: () => boolean;
    loadProfesionales: ReturnType<typeof vi.fn>;
    loadProcedures: ReturnType<typeof vi.fn>;
    setActiveTab: ReturnType<typeof vi.fn>;
    goToEdit: ReturnType<typeof vi.fn>;
    profesionalesList: WritableSignal<IActiveProfessional[]>;
    isLoading: WritableSignal<boolean>;
    isSaving: WritableSignal<boolean>;
    error: WritableSignal<string | null>;
    saveError: WritableSignal<string | null>;
    procedures: WritableSignal<IProcedure[]>;
  };

  beforeEach(async () => {
    mockActiveTabSignal = signal<ProfesionalesTabId>(PROFESIONALES_TABS.LIST);
    mockEditingProfessionalSignal = signal<IActiveProfessional | null>(null);

    mockService = {
      activeTab: mockActiveTabSignal,
      editingProfessional: mockEditingProfessionalSignal,
      isEditMode: () => mockEditingProfessionalSignal() !== null,
      loadProfesionales: vi.fn(),
      loadProcedures: vi.fn(),
      setActiveTab: vi.fn((tab: ProfesionalesTabId) => {
        mockActiveTabSignal.set(tab);
      }),
      goToEdit: vi.fn((prof: IActiveProfessional) => {
        mockEditingProfessionalSignal.set(prof);
        mockActiveTabSignal.set(PROFESIONALES_TABS.FORM);
      }),
      profesionalesList: signal<IActiveProfessional[]>([]),
      isLoading: signal<boolean>(false),
      isSaving: signal<boolean>(false),
      error: signal<string | null>(null),
      saveError: signal<string | null>(null),
      procedures: signal<IProcedure[]>([]),
    };

    await TestBed.configureTestingModule({
      imports: [RemoteEntryComponent],
      providers: [
        provideNoopAnimations(),
        {
          provide: ProfesionalesAdminService,
          useValue: mockService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RemoteEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse, invocar loadProfesionales() y loadProcedures() al inicializar y renderizar lib-tabs-collection', () => {
    expect(component).toBeTruthy();
    expect(mockService.loadProfesionales).toHaveBeenCalledTimes(1);
    expect(mockService.loadProcedures).toHaveBeenCalledTimes(1);

    const tabsCollectionDebug = fixture.debugElement.query(
      By.directive(TabsCollectionComponent)
    );
    expect(tabsCollectionDebug).toBeTruthy();
  });

  it('debe exponer las 2 pestañas (LIST y FORM) y alternar el label entre "Agregar Profesional" y "Editar Profesional"', () => {
    const tabsInitial = component.tabs();
    expect(tabsInitial.length).toBe(2);
    expect(tabsInitial[0].id).toBe(PROFESIONALES_TABS.LIST);
    expect(tabsInitial[0].label).toBe('Lista de Profesionales');
    expect(tabsInitial[0].icon).toBe('badge');

    expect(tabsInitial[1].id).toBe(PROFESIONALES_TABS.FORM);
    expect(tabsInitial[1].label).toBe('Agregar Profesional');
    expect(tabsInitial[1].icon).toBe('person_add');

    // Cambiar a modo edición
    mockService.goToEdit(mockProfessional);
    fixture.detectChanges();

    const tabsEditing = component.tabs();
    expect(tabsEditing[1].label).toBe('Editar Profesional');
    expect(tabsEditing[1].icon).toBe('edit_note');
  });

  it('debe actualizar activeTab en el servicio al llamar onActiveTabChange con un tabId válido', () => {
    component.onActiveTabChange(PROFESIONALES_TABS.FORM);

    expect(mockService.setActiveTab).toHaveBeenCalledWith(
      PROFESIONALES_TABS.FORM
    );
    expect(mockService.activeTab()).toBe(PROFESIONALES_TABS.FORM);
  });

  it('no debe actualizar activeTab si el tabId recibido es inválido o no reconocido', () => {
    component.onActiveTabChange('invalid-tab-id' as unknown as ProfesionalesTabId);
    expect(mockService.setActiveTab).not.toHaveBeenCalled();
  });
});
