import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal, WritableSignal } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { IProcedure } from '@nx-boilerplate/api-interfaces';
import { ProcedimientosAdminService } from '../../services/procedimientos-admin.service';
import { ProcedimientosListComponent } from './procedimientos-list.component';

describe('ProcedimientosListComponent', () => {
  let component: ProcedimientosListComponent;
  let fixture: ComponentFixture<ProcedimientosListComponent>;

  let mockActiveProcedimientos: WritableSignal<IProcedure[]>;
  let mockService: {
    activeProcedimientos: WritableSignal<IProcedure[]>;
    isLoading: WritableSignal<boolean>;
    error: WritableSignal<string | null>;
    goToCreate: ReturnType<typeof vi.fn>;
    goToEdit: ReturnType<typeof vi.fn>;
    deleteProcedimiento: ReturnType<typeof vi.fn>;
  };

  let mockDialog: {
    open: ReturnType<typeof vi.fn>;
  };

  const procFree: IProcedure = {
    idProcedimiento: 'PROC-EST-001',
    nombreProcedimiento: 'Rinoplastia Estética',
    valorStandar: 3500000,
    duracionStandar: 90,
    isActive: true,
    medicosRelacionados: [],
  };

  const procLinked: IProcedure = {
    idProcedimiento: 'PROC-EST-002',
    nombreProcedimiento: 'Blefaroplastia',
    valorStandar: 2000000,
    duracionStandar: 60,
    isActive: true,
    medicosRelacionados: ['12345678', '87654321'],
  };

  beforeEach(async () => {
    mockActiveProcedimientos = signal<IProcedure[]>([procFree, procLinked]);

    mockService = {
      activeProcedimientos: mockActiveProcedimientos,
      isLoading: signal(false),
      error: signal(null),
      goToCreate: vi.fn(),
      goToEdit: vi.fn(),
      deleteProcedimiento: vi.fn().mockReturnValue(of(true)),
    };

    mockDialog = {
      open: vi.fn().mockReturnValue({
        afterClosed: () => of(true),
      }),
    };

    await TestBed.configureTestingModule({
      imports: [ProcedimientosListComponent],
      providers: [
        provideNoopAnimations(),
        { provide: ProcedimientosAdminService, useValue: mockService },
        { provide: MatDialog, useValue: mockDialog },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProcedimientosListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe llamar a goToCreate al invocar onAddNew', () => {
    component.onAddNew();
    expect(mockService.goToCreate).toHaveBeenCalledTimes(1);
  });

  it('debe llamar a goToEdit al manejar la acción edit', () => {
    component.handleAction({ action: 'edit', row: procFree });
    expect(mockService.goToEdit).toHaveBeenCalledWith(procFree);
  });

  it('debe mostrar modal informativo y NO invocar deleteProcedimiento si tiene médicos vinculados', () => {
    component.handleAction({ action: 'delete', row: procLinked });

    expect(mockDialog.open).toHaveBeenCalledTimes(1);
    const dialogArgs = mockDialog.open.mock.calls[0][1];
    expect(dialogArgs.data.title).toBe('No es posible eliminar');
    expect(dialogArgs.data.text).toContain('asignado a 2 profesional(es)');
    expect(mockService.deleteProcedimiento).not.toHaveBeenCalled();
  });

  it('debe abrir modal de confirmación e invocar deleteProcedimiento si está libre de vinculaciones', () => {
    component.handleAction({ action: 'delete', row: procFree });

    expect(mockDialog.open).toHaveBeenCalledTimes(1);
    const dialogArgs = mockDialog.open.mock.calls[0][1];
    expect(dialogArgs.data.title).toBe('¿Eliminar procedimiento?');
    expect(mockService.deleteProcedimiento).toHaveBeenCalledWith('PROC-EST-001');
  });
});
