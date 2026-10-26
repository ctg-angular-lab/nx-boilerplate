import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { signal, WritableSignal } from '@angular/core';
import { IProcedure } from '@nx-boilerplate/api-interfaces';
import { TabsCollectionComponent } from '@nx-boilerplate/layouts';
import {
  PROCEDIMIENTOS_TABS,
  ProcedimientosTabId,
} from '../models/procedimientos-nav.models';
import { ProcedimientosAdminService } from '../services/procedimientos-admin.service';
import { RemoteEntryComponent } from './remote-entry.component';

const mockProcedure: IProcedure = {
  idProcedimiento: 'PROC-EST-001',
  nombreProcedimiento: 'Rinoplastia Estética',
  valorStandar: 3500000,
  duracionStandar: 90,
  isActive: true,
};

describe('RemoteEntryComponent (Procedimientos Tab Host)', () => {
  let component: RemoteEntryComponent;
  let fixture: ComponentFixture<RemoteEntryComponent>;

  let mockActiveTabSignal: WritableSignal<ProcedimientosTabId>;
  let mockEditingProcedureSignal: WritableSignal<IProcedure | null>;
  let mockIsRestoringInactiveSignal: WritableSignal<boolean>;

  let mockService: {
    activeTab: WritableSignal<ProcedimientosTabId>;
    editingProcedure: WritableSignal<IProcedure | null>;
    isRestoringInactive: WritableSignal<boolean>;
    isEditMode: () => boolean;
    loadProcedimientos: ReturnType<typeof vi.fn>;
    setActiveTab: ReturnType<typeof vi.fn>;
    goToEdit: ReturnType<typeof vi.fn>;
    startRestoreInactive: ReturnType<typeof vi.fn>;
    activeProcedimientos: WritableSignal<IProcedure[]>;
    isLoading: WritableSignal<boolean>;
    isSaving: WritableSignal<boolean>;
    error: WritableSignal<string | null>;
    saveError: WritableSignal<string | null>;
  };

  beforeEach(async () => {
    mockActiveTabSignal = signal<ProcedimientosTabId>(PROCEDIMIENTOS_TABS.LIST);
    mockEditingProcedureSignal = signal<IProcedure | null>(null);
    mockIsRestoringInactiveSignal = signal<boolean>(false);

    mockService = {
      activeTab: mockActiveTabSignal,
      editingProcedure: mockEditingProcedureSignal,
      isRestoringInactive: mockIsRestoringInactiveSignal,
      isEditMode: () =>
        mockEditingProcedureSignal() !== null && !mockIsRestoringInactiveSignal(),
      loadProcedimientos: vi.fn(),
      setActiveTab: vi.fn((tab: ProcedimientosTabId) => {
        mockActiveTabSignal.set(tab);
      }),
      goToEdit: vi.fn((proc: IProcedure) => {
        mockEditingProcedureSignal.set(proc);
        mockIsRestoringInactiveSignal.set(false);
        mockActiveTabSignal.set(PROCEDIMIENTOS_TABS.FORM);
      }),
      startRestoreInactive: vi.fn((proc: IProcedure) => {
        mockEditingProcedureSignal.set(proc);
        mockIsRestoringInactiveSignal.set(true);
        mockActiveTabSignal.set(PROCEDIMIENTOS_TABS.FORM);
      }),
      activeProcedimientos: signal<IProcedure[]>([]),
      isLoading: signal<boolean>(false),
      isSaving: signal<boolean>(false),
      error: signal<string | null>(null),
      saveError: signal<string | null>(null),
    };

    await TestBed.configureTestingModule({
      imports: [RemoteEntryComponent],
      providers: [
        provideNoopAnimations(),
        {
          provide: ProcedimientosAdminService,
          useValue: mockService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RemoteEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse, invocar loadProcedimientos() al inicializar y renderizar lib-tabs-collection', () => {
    expect(component).toBeTruthy();
    expect(mockService.loadProcedimientos).toHaveBeenCalledTimes(1);

    const tabsCollectionDebug = fixture.debugElement.query(
      By.directive(TabsCollectionComponent)
    );
    expect(tabsCollectionDebug).toBeTruthy();
  });

  it('debe exponer las 2 pestañas (LIST y FORM) y alternar dinámicamente el label e ícono', () => {
    const tabsInitial = component.tabs();
    expect(tabsInitial.length).toBe(2);
    expect(tabsInitial[0].id).toBe(PROCEDIMIENTOS_TABS.LIST);
    expect(tabsInitial[0].label).toBe('Lista de Procedimientos');
    expect(tabsInitial[0].icon).toBe('list_alt');

    expect(tabsInitial[1].id).toBe(PROCEDIMIENTOS_TABS.FORM);
    expect(tabsInitial[1].label).toBe('Agregar Procedimiento');
    expect(tabsInitial[1].icon).toBe('add_circle');

    // Modo Edición
    mockService.goToEdit(mockProcedure);
    fixture.detectChanges();

    const tabsEditing = component.tabs();
    expect(tabsEditing[1].label).toBe('Editar Procedimiento');
    expect(tabsEditing[1].icon).toBe('edit_note');

    // Modo Reactivación de Inactivo
    mockService.startRestoreInactive(mockProcedure);
    fixture.detectChanges();

    const tabsRestoring = component.tabs();
    expect(tabsRestoring[1].label).toBe('Reactivar Procedimiento');
    expect(tabsRestoring[1].icon).toBe('history');
  });

  it('debe actualizar activeTab en el servicio al llamar onActiveTabChange con un tabId válido', () => {
    component.onActiveTabChange(PROCEDIMIENTOS_TABS.FORM);

    expect(mockService.setActiveTab).toHaveBeenCalledWith(
      PROCEDIMIENTOS_TABS.FORM
    );
    expect(mockService.activeTab()).toBe(PROCEDIMIENTOS_TABS.FORM);
  });

  it('no debe actualizar activeTab si el tabId recibido es inválido o no reconocido', () => {
    component.onActiveTabChange('invalid-tab-id' as unknown as ProcedimientosTabId);
    expect(mockService.setActiveTab).not.toHaveBeenCalled();
  });
});
