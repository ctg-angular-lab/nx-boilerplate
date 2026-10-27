import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { IActiveProfessional } from '@nx-boilerplate/api-interfaces';
import { ConfirmationModalComponent, DataTableComponent } from '@nx-boilerplate/layouts';
import { ProfesionalesAdminService } from '../../services/profesionales-admin.service';
import { ProfesionalesListComponent } from './profesionales-list.component';

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
    recesoAlmuerzo: {
      inicio: '12:00',
      fin: '13:00',
    },
  },
};

describe('ProfesionalesListComponent', () => {
  let component: ProfesionalesListComponent;
  let fixture: ComponentFixture<ProfesionalesListComponent>;

  let mockProfesionalesListSignal = signal<IActiveProfessional[]>([]);
  let mockIsLoadingSignal = signal<boolean>(false);
  let mockErrorSignal = signal<string | null>(null);

  let mockService: {
    profesionalesList: ReturnType<typeof signal<IActiveProfessional[]>>;
    isLoading: ReturnType<typeof signal<boolean>>;
    error: ReturnType<typeof signal<string | null>>;
    goToCreate: ReturnType<typeof vi.fn>;
    goToEdit: ReturnType<typeof vi.fn>;
    deleteProfesional: ReturnType<typeof vi.fn>;
    reactivateProfesional: ReturnType<typeof vi.fn>;
  };

  let mockDialog: {
    open: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    mockProfesionalesListSignal = signal<IActiveProfessional[]>([mockProfessional]);
    mockIsLoadingSignal = signal<boolean>(false);
    mockErrorSignal = signal<string | null>(null);

    mockService = {
      profesionalesList: mockProfesionalesListSignal,
      isLoading: mockIsLoadingSignal,
      error: mockErrorSignal,
      goToCreate: vi.fn(),
      goToEdit: vi.fn(),
      deleteProfesional: vi.fn().mockReturnValue(of(true)),
      reactivateProfesional: vi.fn().mockReturnValue(of(true)),
    };

    mockDialog = {
      open: vi.fn().mockReturnValue({
        afterClosed: vi.fn().mockReturnValue(of(true)),
      }),
    };

    await TestBed.configureTestingModule({
      imports: [ProfesionalesListComponent],
      providers: [
        provideNoopAnimations(),
        { provide: ProfesionalesAdminService, useValue: mockService },
        { provide: MatDialog, useValue: mockDialog },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfesionalesListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse y renderizar <lib-data-table>', () => {
    expect(component).toBeTruthy();

    const dataTableDebugEl = fixture.debugElement.query(By.directive(DataTableComponent));
    expect(dataTableDebugEl).not.toBeNull();
  });

  it('debe invocar profesionalesService.goToCreate() al pulsar "Agregar nuevo"', () => {
    const addBtn = fixture.debugElement.query(By.css('#btn-agregar-profesional'));
    expect(addBtn).not.toBeNull();

    addBtn.nativeElement.click();

    expect(mockService.goToCreate).toHaveBeenCalledTimes(1);
  });

  it('debe invocar profesionalesService.goToEdit(mockProf) al ejecutar onEdit deteniendo propagación', () => {
    const stopPropagationSpy = vi.fn();
    const fakeEvent = { stopPropagation: stopPropagationSpy } as unknown as Event;

    component.onEdit(mockProfessional, fakeEvent);

    expect(stopPropagationSpy).toHaveBeenCalledTimes(1);
    expect(mockService.goToEdit).toHaveBeenCalledWith(mockProfessional);
  });

  it('debe abrir modal de confirmación y desactivar al confirmar', () => {
    const stopPropagationSpy = vi.fn();
    const fakeEvent = { stopPropagation: stopPropagationSpy } as unknown as Event;

    component.onDelete(mockProfessional, fakeEvent);

    expect(stopPropagationSpy).toHaveBeenCalledTimes(1);
    expect(mockDialog.open).toHaveBeenCalledWith(ConfirmationModalComponent, {
      data: expect.objectContaining({
        title: 'Desactivar profesional',
      }),
      width: '450px',
      disableClose: false,
    });
    expect(mockService.deleteProfesional).toHaveBeenCalledWith(mockProfessional.cedula);
  });

  it('no debe desactivar profesional si el usuario cancela o cierra el modal', () => {
    mockDialog.open.mockReturnValueOnce({
      afterClosed: vi.fn().mockReturnValue(of(false)),
    });

    component.onDelete(mockProfessional);

    expect(mockDialog.open).toHaveBeenCalled();
    expect(mockService.deleteProfesional).not.toHaveBeenCalled();
  });

  it('debe renderizar mensaje de error cuando profesionalesService.error() tiene valor', () => {
    mockErrorSignal.set('Error de conexión con el catálogo');
    fixture.detectChanges();

    const errorEl = fixture.debugElement.query(By.css('.profesionales-error'));
    expect(errorEl).not.toBeNull();
    expect(errorEl.nativeElement.textContent).toContain('Error de conexión con el catálogo');
  });

  it('no debe renderizar mensaje de error cuando profesionalesService.error() es null', () => {
    mockErrorSignal.set(null);
    fixture.detectChanges();

    const errorEl = fixture.debugElement.query(By.css('.profesionales-error'));
    expect(errorEl).toBeNull();
  });

  it('debe filtrar correctamente profesionales activos e inactivos en displayedProfesionales', () => {
    const inactiveProf: IActiveProfessional = {
      ...mockProfessional,
      cedula: '87654321',
      isActive: false,
    };
    mockProfesionalesListSignal.set([mockProfessional, inactiveProf]);
    fixture.detectChanges();

    expect(component.viewFilter()).toBe('activos');
    expect(component.displayedProfesionales()).toEqual([mockProfessional]);
    expect(component.emptyMessage()).toBe('No hay profesionales activos registrados.');

    component.onFilterChange('inactivos');
    fixture.detectChanges();

    expect(component.viewFilter()).toBe('inactivos');
    expect(component.displayedProfesionales()).toEqual([inactiveProf]);
    expect(component.emptyMessage()).toBe('No hay profesionales inactivos.');
  });

  it('debe abrir modal de confirmación y reactivar al confirmar', () => {
    const stopPropagationSpy = vi.fn();
    const fakeEvent = { stopPropagation: stopPropagationSpy } as unknown as Event;

    component.onReactivate(mockProfessional, fakeEvent);

    expect(stopPropagationSpy).toHaveBeenCalledTimes(1);
    expect(mockDialog.open).toHaveBeenCalledWith(ConfirmationModalComponent, {
      data: expect.objectContaining({
        title: 'Reactivar profesional',
      }),
      width: '450px',
      disableClose: false,
    });
    expect(mockService.reactivateProfesional).toHaveBeenCalledWith(mockProfessional.cedula);
  });

  it('no debe reactivar profesional si el usuario cancela o cierra el modal', () => {
    mockDialog.open.mockReturnValueOnce({
      afterClosed: vi.fn().mockReturnValue(of(false)),
    });

    component.onReactivate(mockProfessional);

    expect(mockDialog.open).toHaveBeenCalled();
    expect(mockService.reactivateProfesional).not.toHaveBeenCalled();
  });
});
