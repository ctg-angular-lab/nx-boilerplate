import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import {
  IApiResponse,
  ICreateProcedureRequest,
  IProcedure,
  IUpdateProcedureRequest,
} from '@nx-boilerplate/api-interfaces';
import { ApiClientService } from '@nx-boilerplate/data-access';
import { PROCEDIMIENTOS_TABS } from '../models/procedimientos-nav.models';
import { ProcedimientosAdminService } from './procedimientos-admin.service';

const buildProcedure = (
  idProcedimiento: string,
  nombreProcedimiento: string,
  isActive = true
): IProcedure => ({
  idProcedimiento,
  nombreProcedimiento,
  valorStandar: 150000,
  duracionStandar: 60,
  isActive,
  medicosRelacionados: [],
  laboratorios: [
    {
      nombreLaboratorio: 'Insumo Base',
      precio: 20000,
      medidaPorUnidad: 'Kit',
    },
  ],
});

const ok = <T>(data: T): IApiResponse<T> => ({
  success: true,
  statusCode: 200,
  message: 'OK',
  data,
});

describe('ProcedimientosAdminService', () => {
  let service: ProcedimientosAdminService;
  let apiClient: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    patch: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  const proc1 = buildProcedure('PROC-EST-001', 'Rinoplastia Estética', true);
  const proc2 = buildProcedure('PROC-EST-002', 'Blefaroplastia Superior', false);
  const proc3 = buildProcedure('PROC-EST-003', 'Otoplastia Bilateral', true);

  beforeEach(() => {
    apiClient = {
      get: vi.fn().mockReturnValue(of(ok([proc1, proc2, proc3]))),
      post: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: ApiClientService, useValue: apiClient }],
    });
    service = TestBed.inject(ProcedimientosAdminService);
  });

  describe('Estado Inicial', () => {
    it('debe iniciar en la pestaña LIST, sin edición ni errores', () => {
      expect(service.activeTab()).toBe(PROCEDIMIENTOS_TABS.LIST);
      expect(service.isEditMode()).toBe(false);
      expect(service.editingProcedure()).toBeNull();
      expect(service.isRestoringInactive()).toBe(false);
      expect(service.isSaving()).toBe(false);
      expect(service.saveError()).toBeNull();
      expect(service.error()).toBeNull();
      expect(service.allProcedimientos()).toEqual([]);
      expect(service.activeProcedimientos()).toEqual([]);
    });
  });

  describe('Carga de Procedimientos (loadProcedimientos)', () => {
    it('debe solicitar el catálogo completo con includeInactive=true y separar los activos en computed', () => {
      service.loadProcedimientos();

      expect(apiClient.get).toHaveBeenCalledWith('/api/procedures', {
        params: { includeInactive: 'true' },
      });
      expect(service.allProcedimientos().length).toBe(3);
      expect(service.activeProcedimientos().length).toBe(2);
      expect(service.activeProcedimientos()).toEqual([proc1, proc3]);
      expect(service.isLoading()).toBe(false);
      expect(service.error()).toBeNull();
    });

    it('debe setear error y lista vacía ante fallo HTTP', () => {
      apiClient.get.mockReturnValue(throwError(() => new Error('Error de conexión')));
      vi.spyOn(console, 'error').mockImplementation(() => undefined);

      service.loadProcedimientos();

      expect(service.allProcedimientos()).toEqual([]);
      expect(service.activeProcedimientos()).toEqual([]);
      expect(service.error()).toBe('No se pudo cargar el catálogo de procedimientos.');
      expect(service.isLoading()).toBe(false);
    });
  });

  describe('Búsqueda Normalizada (findExistingByName)', () => {
    beforeEach(() => {
      service.loadProcedimientos();
    });

    it('debe encontrar coincidencia ignorando mayúsculas, acentos y espacios adicionales', () => {
      const match = service.findExistingByName('   rInOpLaStIa   estetica  ');
      expect(match).toBeDefined();
      expect(match?.idProcedimiento).toBe('PROC-EST-001');
    });

    it('debe encontrar procedimientos inactivos coincidentes', () => {
      const match = service.findExistingByName('blefaroplastia superior');
      expect(match).toBeDefined();
      expect(match?.idProcedimiento).toBe('PROC-EST-002');
      expect(match?.isActive).toBe(false);
    });

    it('debe retornar undefined si no hay coincidencia o el texto está vacío', () => {
      expect(service.findExistingByName('Lipoescultura')).toBeUndefined();
      expect(service.findExistingByName('')).toBeUndefined();
    });
  });

  describe('Orquestación de Navegación', () => {
    it('goToCreate debe limpiar edición y activar pestaña FORM', () => {
      service.goToCreate();
      expect(service.activeTab()).toBe(PROCEDIMIENTOS_TABS.FORM);
      expect(service.editingProcedure()).toBeNull();
      expect(service.isRestoringInactive()).toBe(false);
    });

    it('goToEdit debe cargar el procedimiento a editar y activar FORM en modo edición', () => {
      service.goToEdit(proc1);
      expect(service.activeTab()).toBe(PROCEDIMIENTOS_TABS.FORM);
      expect(service.editingProcedure()).toEqual(proc1);
      expect(service.isEditMode()).toBe(true);
      expect(service.isRestoringInactive()).toBe(false);
    });

    it('startRestoreInactive debe cargar el procedimiento y activar modo reactivación', () => {
      service.startRestoreInactive(proc2);
      expect(service.activeTab()).toBe(PROCEDIMIENTOS_TABS.FORM);
      expect(service.editingProcedure()).toEqual(proc2);
      expect(service.isRestoringInactive()).toBe(true);
      expect(service.isEditMode()).toBe(false);
    });

    it('goToList y setActiveTab(LIST) deben resetear la edición y errores', () => {
      service.goToEdit(proc1);
      service.goToList();
      expect(service.activeTab()).toBe(PROCEDIMIENTOS_TABS.LIST);
      expect(service.editingProcedure()).toBeNull();
      expect(service.isRestoringInactive()).toBe(false);
      expect(service.saveError()).toBeNull();
    });
  });

  describe('Mutaciones HTTP', () => {
    const createDto: ICreateProcedureRequest = {
      nombreProcedimiento: 'Mamoplastia de Aumento',
      valorStandar: 5000000,
      duracionStandar: 120,
    };

    const updateDto: IUpdateProcedureRequest = {
      valorStandar: 180000,
      isActive: true,
    };

    it('createProcedimiento debe invocar POST, recargar el catálogo y volver a la lista', () => {
      const created = buildProcedure('PROC-EST-004', 'Mamoplastia de Aumento', true);
      apiClient.post.mockReturnValue(of(ok(created)));

      let emitted: IProcedure | null = null;
      service.createProcedimiento(createDto).subscribe((res) => {
        emitted = res;
      });

      expect(apiClient.post).toHaveBeenCalledWith('/api/procedures', createDto);
      expect(emitted).toEqual(created);
      expect(service.activeTab()).toBe(PROCEDIMIENTOS_TABS.LIST);
      expect(service.isSaving()).toBe(false);
    });

    it('createProcedimiento debe recargar catálogo y capturar saveError ante conflicto 409', () => {
      const error409 = new HttpErrorResponse({
        status: 409,
        error: { message: 'Ya existe un procedimiento activo con este nombre' },
      });
      apiClient.post.mockReturnValue(throwError(() => error409));

      let emitted: IProcedure | null = null;
      service.createProcedimiento(createDto).subscribe((res) => {
        emitted = res;
      });

      expect(emitted).toBeNull();
      expect(service.saveError()).toBe('Ya existe un procedimiento activo con este nombre');
      expect(service.isSaving()).toBe(false);
    });

    it('updateProcedimiento debe invocar PATCH, recargar catálogo y volver a la lista', () => {
      const updated = { ...proc1, valorStandar: 180000 };
      apiClient.patch.mockReturnValue(of(ok(updated)));

      let emitted: IProcedure | null = null;
      service.updateProcedimiento('PROC-EST-001', updateDto).subscribe((res) => {
        emitted = res;
      });

      expect(apiClient.patch).toHaveBeenCalledWith(
        '/api/procedures/PROC-EST-001',
        updateDto
      );
      expect(emitted).toEqual(updated);
      expect(service.activeTab()).toBe(PROCEDIMIENTOS_TABS.LIST);
      expect(service.isSaving()).toBe(false);
    });

    it('deleteProcedimiento debe aplicar Optimistic UI de inmediato y confirmar al éxito', () => {
      service.loadProcedimientos();
      expect(service.activeProcedimientos().length).toBe(2);

      apiClient.delete.mockReturnValue(of(ok(null)));

      let success = false;
      service.deleteProcedimiento('PROC-EST-001').subscribe((res) => {
        success = res;
      });

      expect(success).toBe(true);
      expect(apiClient.delete).toHaveBeenCalledWith('/api/procedures/PROC-EST-001');
      // En la lista de activos quedó desactivado
      expect(service.activeProcedimientos().some((p) => p.idProcedimiento === 'PROC-EST-001')).toBe(false);
    });

    it('deleteProcedimiento debe revertir el cambio optimista ante fallo y exponer error', () => {
      service.loadProcedimientos();
      const initialActiveCount = service.activeProcedimientos().length;

      const error409 = new HttpErrorResponse({
        status: 409,
        error: { message: 'El procedimiento está asignado a 2 profesionales activos' },
      });
      apiClient.delete.mockReturnValue(throwError(() => error409));

      let success = true;
      service.deleteProcedimiento('PROC-EST-001').subscribe((res) => {
        success = res;
      });

      expect(success).toBe(false);
      // El procedimiento volvió a estar presente en activos
      expect(service.activeProcedimientos().length).toBe(initialActiveCount);
      expect(service.error()).toBe('El procedimiento está asignado a 2 profesionales activos');
    });
  });
});
