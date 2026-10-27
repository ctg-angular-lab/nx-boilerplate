import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal, WritableSignal } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { IProcedure } from '@nx-boilerplate/api-interfaces';
import { ProcedimientosAdminService } from '../../services/procedimientos-admin.service';
import { ProcedimientosFormComponent } from './procedimientos-form.component';

describe('ProcedimientosFormComponent', () => {
  let component: ProcedimientosFormComponent;
  let fixture: ComponentFixture<ProcedimientosFormComponent>;

  let mockEditingProcedure: WritableSignal<IProcedure | null>;
  let mockIsRestoringInactive: WritableSignal<boolean>;
  let mockIsSaving: WritableSignal<boolean>;
  let mockSaveError: WritableSignal<string | null>;

  let mockService: {
    editingProcedure: WritableSignal<IProcedure | null>;
    isRestoringInactive: WritableSignal<boolean>;
    isEditMode: () => boolean;
    isSaving: WritableSignal<boolean>;
    saveError: WritableSignal<string | null>;
    findExistingByName: ReturnType<typeof vi.fn>;
    startRestoreInactive: ReturnType<typeof vi.fn>;
    goToList: ReturnType<typeof vi.fn>;
    createProcedimiento: ReturnType<typeof vi.fn>;
    updateProcedimiento: ReturnType<typeof vi.fn>;
  };

  const procActive: IProcedure = {
    idProcedimiento: 'PROC-EST-001',
    nombreProcedimiento: 'Rinoplastia',
    valorStandar: 3500000,
    duracionStandar: 90,
    isActive: true,
  };

  const procInactive: IProcedure = {
    idProcedimiento: 'PROC-EST-002',
    nombreProcedimiento: 'Blefaroplastia',
    valorStandar: 2000000,
    duracionStandar: 60,
    isActive: false,
    laboratorios: [
      {
        nombreLaboratorio: 'Sutura fina',
        precio: 30000,
        medidaPorUnidad: 'Sobre',
      },
    ],
  };

  beforeEach(async () => {
    mockEditingProcedure = signal<IProcedure | null>(null);
    mockIsRestoringInactive = signal<boolean>(false);
    mockIsSaving = signal<boolean>(false);
    mockSaveError = signal<string | null>(null);

    mockService = {
      editingProcedure: mockEditingProcedure,
      isRestoringInactive: mockIsRestoringInactive,
      isEditMode: () => mockEditingProcedure() !== null && !mockIsRestoringInactive(),
      isSaving: mockIsSaving,
      saveError: mockSaveError,
      findExistingByName: vi.fn(),
      startRestoreInactive: vi.fn((proc: IProcedure) => {
        mockEditingProcedure.set(proc);
        mockIsRestoringInactive.set(true);
      }),
      goToList: vi.fn(),
      createProcedimiento: vi.fn().mockReturnValue(of(procActive)),
      updateProcedimiento: vi.fn().mockReturnValue(of(procActive)),
    };

    await TestBed.configureTestingModule({
      imports: [ProcedimientosFormComponent],
      providers: [
        provideNoopAnimations(),
        { provide: ProcedimientosAdminService, useValue: mockService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProcedimientosFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse correctamente con el formulario en blanco', () => {
    expect(component).toBeTruthy();
    expect(component.form.controls.step1.controls.nombreProcedimiento.value).toBe('');
    expect(component.form.controls.step2.controls.valorStandar.value).toBeNull();
    expect(component.laboratoriosArray.length).toBe(0);
  });

  it('no debe borrar el nombre ni resetear el formulario al escribir en modo creación', () => {
    // Simular escritura progresiva en el input
    component.form.controls.step1.controls.nombreProcedimiento.setValue('Bio');
    fixture.detectChanges();
    expect(component.form.controls.step1.controls.nombreProcedimiento.value).toBe('Bio');
    expect(component.form.controls.step1.valid).toBe(true);

    // Escribir el 4to caracter y más
    component.form.controls.step1.controls.nombreProcedimiento.setValue('Bioestimuladores de colágeno');
    fixture.detectChanges();

    // El valor debe preservarse intacto y el formulario no debe haberse reseteado
    expect(component.form.controls.step1.controls.nombreProcedimiento.value).toBe(
      'Bioestimuladores de colágeno'
    );
    expect(component.form.controls.step1.valid).toBe(true);
  });

  it('debe sincronizar correctamente entre modo edición y regreso a modo creación', () => {
    // 1. Pasar a modo edición
    mockEditingProcedure.set(procActive);
    fixture.detectChanges();

    expect(component.form.controls.step1.controls.nombreProcedimiento.value).toBe('Rinoplastia');
    expect(component.form.controls.step2.controls.valorStandar.value).toBe(3500000);

    // 2. Regresar a modo creación (editingProcedure = null)
    mockEditingProcedure.set(null);
    fixture.detectChanges();

    expect(component.form.controls.step1.controls.nombreProcedimiento.value).toBe('');
    expect(component.form.controls.step2.controls.valorStandar.value).toBeNull();
  });

  describe('Paso 1: Validación y Regla de Negocio 3', () => {
    it('no debe avanzar si el nombre es inválido', () => {
      component.form.controls.step1.controls.nombreProcedimiento.setValue('Ab'); // Menos de 3 letras
      component.onStep1Next();
      expect(component.form.controls.step1.invalid).toBe(true);
    });

    it('debe bloquear con duplicateName si existe un procedimiento activo con el mismo nombre', () => {
      mockService.findExistingByName.mockReturnValue(procActive);
      component.form.controls.step1.controls.nombreProcedimiento.setValue('Rinoplastia');

      component.onStep1Next();

      expect(
        component.form.controls.step1.controls.nombreProcedimiento.hasError('duplicateName')
      ).toBe(true);
      expect(mockService.startRestoreInactive).not.toHaveBeenCalled();
    });

    it('debe activar startRestoreInactive y precargar datos si existe un procedimiento inactivo', () => {
      mockService.findExistingByName.mockReturnValue(procInactive);
      component.form.controls.step1.controls.nombreProcedimiento.setValue('Blefaroplastia');

      component.onStep1Next();

      expect(mockService.startRestoreInactive).toHaveBeenCalledWith(procInactive);
      expect(component.form.controls.step2.controls.valorStandar.value).toBe(2000000);
      expect(component.form.controls.step2.controls.duracionStandar.value).toBe(60);
      expect(component.form.controls.step2.controls.tieneLaboratorio.value).toBe(true);
      expect(component.laboratoriosArray.length).toBe(1);
    });
  });

  describe('Paso 2: Laboratorios Dinámicos', () => {
    it('debe agregar un laboratorio automáticamente al activar tieneLaboratorio si está vacío', () => {
      component.form.controls.step2.controls.tieneLaboratorio.setValue(true);
      fixture.detectChanges();

      expect(component.laboratoriosArray.length).toBe(1);
    });

    it('debe apagar tieneLaboratorio automáticamente si se eliminan todos los laboratorios', () => {
      component.form.controls.step2.controls.tieneLaboratorio.setValue(true);
      expect(component.laboratoriosArray.length).toBe(1);

      component.onRemoveLaboratory(0);

      expect(component.laboratoriosArray.length).toBe(0);
      expect(component.form.controls.step2.controls.tieneLaboratorio.value).toBe(false);
    });

    it('debe limpiar laboratoriosArray al apagar tieneLaboratorio manualmente', () => {
      component.form.controls.step2.controls.tieneLaboratorio.setValue(true);
      component.onAddLaboratory();
      expect(component.laboratoriosArray.length).toBe(2);

      component.form.controls.step2.controls.tieneLaboratorio.setValue(false);
      expect(component.laboratoriosArray.length).toBe(0);
    });
  });

  describe('Envío del Formulario (onSubmit)', () => {
    beforeEach(() => {
      component.form.controls.step1.setValue({ nombreProcedimiento: 'Otoplastia' });
      component.form.controls.step2.patchValue({
        valorStandar: 1800000,
        duracionStandar: 60,
        tieneLaboratorio: false,
      });
      fixture.detectChanges();
    });

    it('debe llamar a createProcedimiento en modo creación', () => {
      component.onSubmit();

      expect(mockService.createProcedimiento).toHaveBeenCalledWith({
        nombreProcedimiento: 'Otoplastia',
        valorStandar: 1800000,
        duracionStandar: 60,
        laboratorios: [],
      });
    });

    it('debe llamar a updateProcedimiento con isActive: true en modo reactivación', () => {
      mockEditingProcedure.set(procInactive);
      mockIsRestoringInactive.set(true);

      component.onSubmit();

      expect(mockService.updateProcedimiento).toHaveBeenCalledWith('PROC-EST-002', {
        nombreProcedimiento: 'Otoplastia',
        valorStandar: 1800000,
        duracionStandar: 60,
        laboratorios: [],
        isActive: true,
      });
    });

    it('debe llamar a updateProcedimiento sin isActive en modo edición regular', () => {
      mockEditingProcedure.set(procActive);
      mockIsRestoringInactive.set(false);

      component.onSubmit();

      expect(mockService.updateProcedimiento).toHaveBeenCalledWith('PROC-EST-001', {
        nombreProcedimiento: 'Otoplastia',
        valorStandar: 1800000,
        duracionStandar: 60,
        laboratorios: [],
      });
    });
  });

  describe('Acciones de Cancelación', () => {
    it('debe resetear el formulario y volver a la lista al pulsar onCancel', () => {
      component.form.controls.step1.setValue({ nombreProcedimiento: 'Prueba' });
      component.onCancel();

      expect(component.form.controls.step1.controls.nombreProcedimiento.value).toBe('');
      expect(mockService.goToList).toHaveBeenCalledTimes(1);
    });
  });
});
