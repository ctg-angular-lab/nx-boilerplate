import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatDialogRef } from '@angular/material/dialog';
import { ICitaMedica, IPatientHistory } from '@nx-boilerplate/api-interfaces';
import { ClinicalRecordDetailComponent } from './clinical-record-detail.component';

describe('ClinicalRecordDetailComponent', () => {
  let component: ClinicalRecordDetailComponent;
  let fixture: ComponentFixture<ClinicalRecordDetailComponent>;
  let mockDialogRef: {
    close: ReturnType<typeof vi.fn>;
  };

  const samplePatient: IPatientHistory = {
    cedula: '12345678',
    tipo_documento: 'CC',
    nombre: 'Ana',
    apellidos: 'Gómez',
    correo: 'ana@example.com',
    celular: '3001234567',
    ultimosProcedimientos: [],
  };

  const sampleRecord: ICitaMedica = {
    appointmentId: 'c-100',
    cedula_paciente: '12345678',
    estado_registro: 'COMPLETADA',
    medico_tratante: [
      {
        nombre_profesional: 'Dra. María Pérez',
        cedula_profesional: '98765432',
        fecha_atencion: '2026-03-10',
      },
    ],
    registro_clinico: {
      motivo_consulta: 'Revisión periódica de piel',
      enfermedad_actual: 'Sin síntomas agudos',
      antecedentes_medicos: {
        patologicos: 'Hipertensión controlada',
        alergicos: 'Penicilina',
        farmacologicos: 'Losartán 50mg',
        procedimientos_previos: 'Ninguno',
      },
      examen_fisico: 'Piel hidratada sin lesiones activas',
      procedimiento_realizado: 'Limpieza Facial Profunda',
      lote_producto: 'LOT-2026-A',
      recomendaciones: 'Aplicar protector solar FPS 50 cada 4 horas',
    },
    soporte_documental: {
      consentimiento_informado: true,
      descargable_consentimiento: 'https://docs.clinica.com/consent/c-100.pdf',
    },
  };

  beforeEach(async () => {
    mockDialogRef = {
      close: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ClinicalRecordDetailComponent],
      providers: [
        provideNoopAnimations(),
        { provide: MatDialogRef, useValue: mockDialogRef },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ClinicalRecordDetailComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('record', sampleRecord);
    fixture.componentRef.setInput('patient', samplePatient);
    fixture.componentRef.setInput('doctorName', 'Dra. María Pérez');
    fixture.detectChanges();
  });

  it('should create and render record details', () => {
    expect(component).toBeTruthy();
    expect(component.isCompletada()).toBe(true);
    expect(component.fechaAtencion()).toBe('2026-03-10');
  });

  it('should emit closed and close dialogRef when onClose is called', () => {
    const closedSpy = vi.spyOn(component.closed, 'emit');

    component.onClose();

    expect(closedSpy).toHaveBeenCalled();
    expect(mockDialogRef.close).toHaveBeenCalledWith(null);
  });
});
