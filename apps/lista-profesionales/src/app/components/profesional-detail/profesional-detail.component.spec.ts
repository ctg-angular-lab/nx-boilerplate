import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MatDialogRef } from '@angular/material/dialog';
import { IActiveProfessional } from '@nx-boilerplate/api-interfaces';
import { ProfesionalDetailComponent } from './profesional-detail.component';

describe('ProfesionalDetailComponent', () => {
  let fixture: ComponentFixture<ProfesionalDetailComponent>;

  let mockDialogRef: {
    close: ReturnType<typeof vi.fn>;
  };

  const mockProfessional: IActiveProfessional = {
    cedula: '12345678',
    nombres: 'Carlos',
    apellidos: 'Gómez',
    email: 'carlos.gomez@test.com',
    profesion: 'Cirujano Plástico',
    horarioTrabajo: {
      diasLaborales: ['Lunes', 'Miércoles', 'Viernes'],
      horaInicio: '08:00',
      horaFin: '17:00',
      recesoAlmuerzo: {
        inicio: '12:00',
        fin: '13:00',
      },
    },
    procedimientosRelacionados: ['PROC-001', 'PROC-002'],
    isActive: true,
  };

  const mockProfessionalEmpty: IActiveProfessional = {
    cedula: '87654321',
    nombres: 'María',
    apellidos: 'López',
    email: 'maria.lopez@test.com',
    profesion: 'Médico General',
    horarioTrabajo: {
      diasLaborales: [],
      horaInicio: '09:00',
      horaFin: '15:00',
    },
    procedimientosRelacionados: [],
    isActive: true,
  };

  beforeEach(async () => {
    mockDialogRef = {
      close: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ProfesionalDetailComponent],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfesionalDetailComponent);
  });

  it('debe renderizar datos de contacto, horario y chips de procedimientos correctamente', () => {
    fixture.componentRef.setInput('professional', mockProfessional);
    fixture.componentRef.setInput('relatedProcedureNames', [
      'Rinoplastia Estética',
      'Blefaroplastia',
    ]);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('carlos.gomez@test.com');
    expect(text).toContain('No registrado (próxima versión)');
    expect(text).toContain('12345678 — Cirujano Plástico');
    expect(text).toContain('Lunes');
    expect(text).toContain('Miércoles');
    expect(text).toContain('08:00 – 17:00');
    expect(text).toContain('12:00 – 13:00');
    expect(text).toContain('Rinoplastia Estética');
    expect(text).toContain('Blefaroplastia');
  });

  it('debe mostrar estados vacíos cuando no hay días o procedimientos', () => {
    fixture.componentRef.setInput('professional', mockProfessionalEmpty);
    fixture.componentRef.setInput('relatedProcedureNames', []);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Sin días configurados');
    expect(text).toContain('Este profesional no tiene procedimientos relacionados actualmente.');
  });

  it('debe invocar dialogRef.close(false) al hacer clic en el botón Cerrar', () => {
    fixture.componentRef.setInput('professional', mockProfessional);
    fixture.componentRef.setInput('relatedProcedureNames', []);
    fixture.detectChanges();

    const closeBtn = fixture.debugElement.query(By.css('.detail-modal__close-btn'));
    expect(closeBtn).toBeTruthy();
    closeBtn.nativeElement.click();

    expect(mockDialogRef.close).toHaveBeenCalledTimes(1);
    expect(mockDialogRef.close).toHaveBeenCalledWith(false);
  });
});
