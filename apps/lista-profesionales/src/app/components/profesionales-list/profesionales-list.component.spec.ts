import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { IActiveProfessional } from '@nx-boilerplate/api-interfaces';
import { DataTableComponent } from '@nx-boilerplate/layouts';
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
    };

    await TestBed.configureTestingModule({
      imports: [ProfesionalesListComponent],
      providers: [
        provideNoopAnimations(),
        { provide: ProfesionalesAdminService, useValue: mockService },
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

  it('debe invocar profesionalesService.deleteProfesional(cedula) al ejecutar onDelete deteniendo propagación', () => {
    const stopPropagationSpy = vi.fn();
    const fakeEvent = { stopPropagation: stopPropagationSpy } as unknown as Event;

    component.onDelete(mockProfessional, fakeEvent);

    expect(stopPropagationSpy).toHaveBeenCalledTimes(1);
    expect(mockService.deleteProfesional).toHaveBeenCalledWith(mockProfessional.cedula);
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
});
