import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { IActiveProfessional, IApiResponse, ICreateProfessionalRequest } from '@nx-boilerplate/api-interfaces';
import { ApiClientService } from '@nx-boilerplate/data-access';
import { PROFESIONALES_TABS } from '../models/profesionales-nav.models';
import { ProfesionalesAdminService } from './profesionales-admin.service';

const buildProfessional = (cedula: string, nombres = 'Ana'): IActiveProfessional => ({
  cedula,
  nombres,
  apellidos: 'Perez',
  email: `${nombres.toLowerCase()}@clinica.com`,
  profesion: 'Médica',
  isActive: true,
  horarioTrabajo: {
    diasLaborales: ['LUNES'],
    horaInicio: '08:00',
    horaFin: '17:00',
    recesoAlmuerzo: null,
  },
});

const ok = <T>(data: T): IApiResponse<T> => ({
  success: true,
  statusCode: 200,
  message: 'OK',
  data,
});

describe('ProfesionalesAdminService', () => {
  let service: ProfesionalesAdminService;
  let apiClient: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    patch: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  const ana = buildProfessional('1001', 'Ana');
  const luis = buildProfessional('1002', 'Luis');

  const createPayload: ICreateProfessionalRequest = {
    cedula: '1003',
    nombres: 'Marta',
    apellidos: 'Gomez',
    email: 'marta@clinica.com',
    profesion: 'Dermatóloga',
    horarioTrabajo: { diasLaborales: ['LUNES', 'MARTES'], horaInicio: '08:00', horaFin: '16:00' },
  };

  beforeEach(() => {
    apiClient = {
      get: vi.fn().mockReturnValue(of(ok([ana, luis]))),
      post: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: ApiClientService, useValue: apiClient }],
    });
    service = TestBed.inject(ProfesionalesAdminService);
  });

  describe('Estado inicial', () => {
    it('debe iniciar en la pestaña LIST, sin edición ni errores', () => {
      expect(service.activeTab()).toBe(PROFESIONALES_TABS.LIST);
      expect(service.isEditMode()).toBe(false);
      expect(service.editingProfessional()).toBeNull();
      expect(service.isSaving()).toBe(false);
      expect(service.saveError()).toBeNull();
      expect(service.procedures()).toEqual([]);
      expect(service.profesionalesList()).toEqual([]);
    });
  });

  describe('Carga de datos', () => {
    it('loadProfesionales debe poblar la lista y apagar isLoading', () => {
      service.loadProfesionales();
      expect(apiClient.get).toHaveBeenCalledWith('/api/doctors', {
        params: { includeInactive: 'true' },
      });
      expect(service.profesionalesList()).toEqual([ana, luis]);
      expect(service.isLoading()).toBe(false);
    });

    it('loadProfesionales debe setear error y lista vacía ante fallo', () => {
      apiClient.get.mockReturnValue(throwError(() => new Error('boom')));
      vi.spyOn(console, 'error').mockImplementation(() => undefined);

      service.loadProfesionales();

      expect(service.profesionalesList()).toEqual([]);
      expect(service.error()).toBe('No se pudo cargar el catálogo de profesionales.');
      expect(service.isLoading()).toBe(false);
    });

    it('loadProcedures debe poblar el catálogo y tolerar errores', () => {
      const procedures = [
        { idProcedimiento: 'P1', nombreProcedimiento: 'Botox', valorStandar: 1, duracionStandar: 45, medicosRelacionados: [] },
      ];
      apiClient.get.mockReturnValueOnce(of(ok(procedures)));
      service.loadProcedures();
      expect(apiClient.get).toHaveBeenCalledWith('/api/procedures');
      expect(service.procedures()).toEqual(procedures);

      vi.spyOn(console, 'error').mockImplementation(() => undefined);
      apiClient.get.mockReturnValueOnce(throwError(() => new Error('fail')));
      service.loadProcedures();
      expect(service.procedures()).toEqual([]);
    });
  });

  describe('Navegación y modo dual', () => {
    it('goToCreate debe navegar a FORM sin profesional en edición', () => {
      service.goToEdit(ana);
      service.goToCreate();

      expect(service.activeTab()).toBe(PROFESIONALES_TABS.FORM);
      expect(service.isEditMode()).toBe(false);
    });

    it('goToEdit debe asignar el profesional y activar modo edición', () => {
      service.goToEdit(ana);

      expect(service.activeTab()).toBe(PROFESIONALES_TABS.FORM);
      expect(service.editingProfessional()).toEqual(ana);
      expect(service.isEditMode()).toBe(true);
    });

    it('goToList debe volver a LIST y limpiar edición y error', () => {
      service.goToEdit(ana);
      service.goToList();

      expect(service.activeTab()).toBe(PROFESIONALES_TABS.LIST);
      expect(service.isEditMode()).toBe(false);
      expect(service.saveError()).toBeNull();
    });

    it('setActiveTab(LIST) debe limpiar edición; setActiveTab(FORM) debe conservarla', () => {
      service.goToEdit(ana);
      service.setActiveTab(PROFESIONALES_TABS.FORM);
      expect(service.isEditMode()).toBe(true);

      service.setActiveTab(PROFESIONALES_TABS.LIST);
      expect(service.activeTab()).toBe(PROFESIONALES_TABS.LIST);
      expect(service.isEditMode()).toBe(false);
    });
  });

  describe('createProfesional', () => {
    it('éxito: debe recargar la lista y volver a LIST', () => {
      const created = buildProfessional('1003', 'Marta');
      apiClient.post.mockReturnValue(of(ok(created)));
      service.goToCreate();

      let result: IActiveProfessional | null | undefined;
      service.createProfesional(createPayload).subscribe((r) => (result = r));

      expect(apiClient.post).toHaveBeenCalledWith('/api/doctors', createPayload);
      expect(result).toEqual(created);
      expect(apiClient.get).toHaveBeenCalledWith('/api/doctors', {
        params: { includeInactive: 'true' },
      });
      expect(service.activeTab()).toBe(PROFESIONALES_TABS.LIST);
      expect(service.isSaving()).toBe(false);
      expect(service.saveError()).toBeNull();
    });

    it('error 409: debe setear saveError, emitir null y mantener la pestaña FORM', () => {
      apiClient.post.mockReturnValue(
        throwError(
          () =>
            new HttpErrorResponse({
              status: 409,
              error: { message: 'El profesional con cédula 1003 ya se encuentra registrado' },
            })
        )
      );
      service.goToCreate();
      apiClient.get.mockClear();

      let result: IActiveProfessional | null | undefined;
      service.createProfesional(createPayload).subscribe((r) => (result = r));

      expect(result).toBeNull();
      expect(service.saveError()).toBe('El profesional con cédula 1003 ya se encuentra registrado');
      expect(service.activeTab()).toBe(PROFESIONALES_TABS.FORM);
      expect(service.isSaving()).toBe(false);
      expect(apiClient.get).not.toHaveBeenCalled();
    });

    it('error sin mensaje del backend: debe usar el texto por defecto', () => {
      apiClient.post.mockReturnValue(throwError(() => new Error('network')));

      service.createProfesional(createPayload).subscribe();

      expect(service.saveError()).toBe('No se pudo registrar el profesional.');
    });

    it('no debe activar isSaving hasta que se suscriba (cold observable)', () => {
      apiClient.post.mockReturnValue(of(ok(buildProfessional('1003'))));

      const obs$ = service.createProfesional(createPayload);
      expect(service.isSaving()).toBe(false);
      expect(apiClient.post).not.toHaveBeenCalled();

      obs$.subscribe();
      expect(apiClient.post).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateProfesional', () => {
    it('éxito: debe llamar PATCH con cédula codificada, recargar y volver a LIST', () => {
      const updated = { ...ana, profesion: 'Cirujana' };
      apiClient.patch.mockReturnValue(of(ok(updated)));
      service.goToEdit(ana);

      let result: IActiveProfessional | null | undefined;
      service.updateProfesional('10/01', { profesion: 'Cirujana' }).subscribe((r) => (result = r));

      expect(apiClient.patch).toHaveBeenCalledWith('/api/doctors/10%2F01', { profesion: 'Cirujana' });
      expect(result).toEqual(updated);
      expect(service.activeTab()).toBe(PROFESIONALES_TABS.LIST);
      expect(service.isEditMode()).toBe(false);
      expect(service.isSaving()).toBe(false);
    });

    it('error: debe setear saveError y mantener la pestaña FORM', () => {
      apiClient.patch.mockReturnValue(
        throwError(() => new HttpErrorResponse({ status: 400, error: { message: ['Correo inválido', 'Profesión requerida'] } }))
      );
      service.goToEdit(ana);

      let result: IActiveProfessional | null | undefined;
      service.updateProfesional(ana.cedula, { email: 'x' }).subscribe((r) => (result = r));

      expect(result).toBeNull();
      expect(service.saveError()).toBe('Correo inválido Profesión requerida');
      expect(service.activeTab()).toBe(PROFESIONALES_TABS.FORM);
      expect(service.isEditMode()).toBe(true);
    });
  });

  describe('deleteProfesional (Optimistic UI)', () => {
    beforeEach(() => {
      service.loadProfesionales();
    });

    it('éxito: debe marcar isActive: false de inmediato y emitir true', () => {
      apiClient.delete.mockReturnValue(of(ok(null)));

      let result: boolean | undefined;
      service.deleteProfesional(ana.cedula).subscribe((r) => (result = r));

      expect(apiClient.delete).toHaveBeenCalledWith('/api/doctors/1001');
      expect(result).toBe(true);
      expect(service.profesionalesList()).toEqual([
        { ...ana, isActive: false },
        luis,
      ]);
      expect(service.profesionalesList().find((p) => p.cedula === ana.cedula)?.isActive).toBe(false);
      expect(service.error()).toBeNull();
    });

    it('fallo: debe revertir la lista, setear error y emitir false', () => {
      apiClient.delete.mockReturnValue(throwError(() => new Error('network')));

      let result: boolean | undefined;
      service.deleteProfesional(ana.cedula).subscribe((r) => (result = r));

      expect(result).toBe(false);
      expect(service.profesionalesList()).toEqual([ana, luis]);
      expect(service.error()).toBe('No se pudo eliminar el profesional.');
    });
  });

  describe('reactivateProfesional (Optimistic UI)', () => {
    const anaInactiva = { ...ana, isActive: false };

    beforeEach(() => {
      apiClient.get.mockReturnValue(of(ok([anaInactiva, luis])));
      service.loadProfesionales();
    });

    it('éxito: debe marcar isActive: true de inmediato y emitir true', () => {
      apiClient.patch.mockReturnValue(of(ok({ ...ana, isActive: true })));

      let result: boolean | undefined;
      service.reactivateProfesional(ana.cedula).subscribe((r) => (result = r));

      expect(apiClient.patch).toHaveBeenCalledWith('/api/doctors/1001', {
        isActive: true,
      });
      expect(result).toBe(true);
      expect(service.profesionalesList()).toEqual([
        { ...anaInactiva, isActive: true },
        luis,
      ]);
      expect(service.profesionalesList().find((p) => p.cedula === ana.cedula)?.isActive).toBe(true);
      expect(service.error()).toBeNull();
    });

    it('fallo: debe revertir la lista con rollback a isActive: false, setear error y emitir false', () => {
      apiClient.patch.mockReturnValue(throwError(() => new Error('network')));

      let result: boolean | undefined;
      service.reactivateProfesional(ana.cedula).subscribe((r) => (result = r));

      expect(result).toBe(false);
      expect(service.profesionalesList()).toEqual([anaInactiva, luis]);
      expect(service.profesionalesList().find((p) => p.cedula === ana.cedula)?.isActive).toBe(false);
      expect(service.error()).toBe(
        'No se pudo reactivar el profesional. Intente nuevamente.'
      );
    });
  });
});
