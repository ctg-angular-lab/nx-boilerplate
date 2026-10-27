import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MatDialogRef } from '@angular/material/dialog';
import { IProcedure } from '@nx-boilerplate/api-interfaces';
import { ProcedimientoDetailComponent } from './procedimiento-detail.component';

describe('ProcedimientoDetailComponent', () => {
  let fixture: ComponentFixture<ProcedimientoDetailComponent>;

  let mockDialogRef: {
    close: ReturnType<typeof vi.fn>;
  };

  const mockProcedureWithData: IProcedure = {
    idProcedimiento: 'PROC-001',
    nombreProcedimiento: 'Rinoplastia Completa',
    valorStandar: 4500000,
    duracionStandar: 120,
    isActive: true,
    medicosRelacionados: ['1001', '1002'],
    laboratorios: [
      {
        nombreLaboratorio: 'Prótesis Nasal Silicona',
        precio: 350000,
        medidaPorUnidad: '1 unidad',
      },
    ],
  };

  const mockProcedureEmpty: IProcedure = {
    idProcedimiento: 'PROC-002',
    nombreProcedimiento: 'Consulta General',
    valorStandar: 80000,
    duracionStandar: 30,
    isActive: true,
    medicosRelacionados: [],
    laboratorios: [],
  };

  beforeEach(async () => {
    mockDialogRef = {
      close: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ProcedimientoDetailComponent],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProcedimientoDetailComponent);
  });

  it('debe renderizar el valor estándar, doctores y laboratorios correctamente', () => {
    fixture.componentRef.setInput('procedure', mockProcedureWithData);
    fixture.componentRef.setInput('relatedDoctorNames', [
      'Dr. Carlos Gómez (Cirujano Plástico)',
      'Dra. Ana López (Anestesióloga)',
    ]);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toMatch(/4[.,]500[.,]000/);
    expect(text).toContain('120 min');
    expect(text).toContain('Dr. Carlos Gómez (Cirujano Plástico)');
    expect(text).toContain('Dra. Ana López (Anestesióloga)');
    expect(text).toContain('Prótesis Nasal Silicona');
    expect(text).toMatch(/350[.,]000/);
    expect(text).toContain('1 unidad');
  });

  it('debe mostrar estados vacíos cuando no hay doctores ni laboratorios', () => {
    fixture.componentRef.setInput('procedure', mockProcedureEmpty);
    fixture.componentRef.setInput('relatedDoctorNames', []);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Sin doctores relacionados actualmente.');
    expect(text).toContain('No aplica precio especial por laboratorio / insumos.');
  });

  it('debe invocar dialogRef.close(false) al hacer clic en el botón Cerrar', () => {
    fixture.componentRef.setInput('procedure', mockProcedureWithData);
    fixture.componentRef.setInput('relatedDoctorNames', []);
    fixture.detectChanges();

    const closeBtn = fixture.debugElement.query(By.css('.detail-modal__close-btn'));
    expect(closeBtn).toBeTruthy();
    closeBtn.nativeElement.click();

    expect(mockDialogRef.close).toHaveBeenCalledTimes(1);
    expect(mockDialogRef.close).toHaveBeenCalledWith(false);
  });
});
