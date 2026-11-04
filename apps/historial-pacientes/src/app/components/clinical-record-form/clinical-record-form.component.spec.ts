import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';
import {
  IActiveProfessional,
  ICitaMedica,
  IPatientHistory,
} from '@nx-boilerplate/api-interfaces';
import { HistorialPacientesService } from '../../services/historial-pacientes.service';
import { ClinicalRecordFormComponent } from './clinical-record-form.component';

describe('ClinicalRecordFormComponent', () => {
  let component: ClinicalRecordFormComponent;
  let fixture: ComponentFixture<ClinicalRecordFormComponent>;
  let mockHistorialService: {
    doctors: ReturnType<typeof signal<IActiveProfessional[]>>;
    createClinicalRecord: ReturnType<typeof vi.fn>;
    updateClinicalRecord: ReturnType<typeof vi.fn>;
    resolveDoctorName: ReturnType<typeof vi.fn>;
  };
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
    _id: 'rec-123',
    appointmentId: 'c-200',
    cedula_paciente: '12345678',
    estado_registro: 'PENDIENTE_ATENCION',
    medico_tratante: [
      {
        nombre_profesional: 'Dr. Roberto Mendoza',
        cedula_profesional: '55667788',
        fecha_atencion: '2026-03-15',
      },
    ],
    registro_clinico: {
      motivo_consulta: 'Consulta inicial de rejuvenecimiento',
      enfermedad_actual: 'Líneas de expresión periorbitales',
      antecedentes_medicos: {
        patologicos: 'Ninguno',
        alergicos: 'Ninguno',
        farmacologicos: 'Ninguno',
        procedimientos_previos: 'Ninguno',
      },
      examen_fisico: 'Piel normohidratada',
      procedimiento_realizado: 'Toxina Botulínica tercio superior',
      lote_producto: 'LOT-TX-99',
      recomendaciones: 'No masajear la zona tratada',
    },
    soporte_documental: {
      consentimiento_informado: true,
      descargable_consentimiento: 'https://docs.clinica.com/c-200.pdf',
    },
  };

  beforeEach(async () => {
    mockHistorialService = {
      doctors: signal<IActiveProfessional[]>([
        {
          cedula: '55667788',
          nombres: 'Roberto',
          apellidos: 'Mendoza',
          email: 'roberto@clinica.com',
          profesion: 'Médico Cirujano',
          horarioTrabajo: { diasLaborales: ['Lunes'], horaInicio: '08:00', horaFin: '17:00' },
        },
      ]),
      createClinicalRecord: vi.fn(),
      updateClinicalRecord: vi.fn(),
      resolveDoctorName: vi.fn().mockReturnValue('Roberto Mendoza'),
    };
    mockDialogRef = {
      close: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ClinicalRecordFormComponent],
      providers: [
        provideNoopAnimations(),
        { provide: HistorialPacientesService, useValue: mockHistorialService },
        { provide: MatDialogRef, useValue: mockDialogRef },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ClinicalRecordFormComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('patient', samplePatient);
    fixture.detectChanges();
  });

  it('should initialize in manual creation mode when record input is null', () => {
    expect(component).toBeTruthy();
    expect(component.isManualCreation()).toBe(true);
    expect(component.form.controls.cedula_profesional.hasError('required')).toBe(true);
  });

  it('should create clinical record with COMPLETADA status in manual mode', () => {
    mockHistorialService.createClinicalRecord.mockReturnValue(of(sampleRecord));
    const savedSpy = vi.spyOn(component.saved, 'emit');

    component.form.patchValue({
      cedula_profesional: '55667788',
      fecha_atencion: '2026-03-15',
      procedimiento_realizado: 'Limpieza Facial',
      motivo_consulta: 'Piel grasa',
      enfermedad_actual: 'Ninguna',
      examen_fisico: 'Comedones en zona T',
      recomendaciones: 'Jabón neutro',
    });

    component.onSubmit();

    expect(mockHistorialService.createClinicalRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        cedula_paciente: '12345678',
        estado_registro: 'COMPLETADA',
        medico_tratante: [
          expect.objectContaining({
            cedula_profesional: '55667788',
            fecha_atencion: '2026-03-15',
          }),
        ],
      })
    );
    expect(savedSpy).toHaveBeenCalled();
    expect(mockDialogRef.close).toHaveBeenCalled();
  });

  it('should preload data and update clinical record when record input is provided', () => {
    fixture.componentRef.setInput('record', sampleRecord);
    fixture.detectChanges();

    expect(component.isManualCreation()).toBe(false);
    expect(component.form.controls.procedimiento_realizado.value).toBe(
      'Toxina Botulínica tercio superior'
    );
    expect(component.form.controls.motivo_consulta.value).toBe(
      'Consulta inicial de rejuvenecimiento'
    );

    mockHistorialService.updateClinicalRecord.mockReturnValue(of(sampleRecord));
    const savedSpy = vi.spyOn(component.saved, 'emit');

    component.onSubmit();

    expect(mockHistorialService.updateClinicalRecord).toHaveBeenCalledWith(
      'rec-123',
      expect.objectContaining({
        estado_registro: 'COMPLETADA',
      })
    );
    expect(savedSpy).toHaveBeenCalled();
    expect(mockDialogRef.close).toHaveBeenCalled();
  });

  it('should sanitize empty strings to default values to avoid backend 400 Bad Request', () => {
    mockHistorialService.createClinicalRecord.mockReturnValue(of(sampleRecord));

    component.form.patchValue({
      cedula_profesional: '55667788',
      fecha_atencion: '2026-03-15',
      procedimiento_realizado: 'Limpieza Facial',
      motivo_consulta: 'Revisión',
      enfermedad_actual: 'Ninguna',
      examen_fisico: 'Normal',
      recomendaciones: 'Protector solar',
      // Blank out optional fields
      patologicos: '   ',
      alergicos: '',
      lote_producto: '   ',
      descargable_consentimiento: '',
    });

    component.onSubmit();

    expect(mockHistorialService.createClinicalRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        registro_clinico: expect.objectContaining({
          antecedentes_medicos: expect.objectContaining({
            patologicos: 'Ninguno',
            alergicos: 'Ninguno',
          }),
          lote_producto: 'N/A',
        }),
        soporte_documental: expect.objectContaining({
          descargable_consentimiento: 'Pendiente de adjunto',
        }),
      })
    );
  });

  it('should emit cancelled and close dialog on onCancel', () => {
    const cancelSpy = vi.spyOn(component.cancelled, 'emit');

    component.onCancel();

    expect(cancelSpy).toHaveBeenCalled();
    expect(mockDialogRef.close).toHaveBeenCalledWith(null);
  });
});
