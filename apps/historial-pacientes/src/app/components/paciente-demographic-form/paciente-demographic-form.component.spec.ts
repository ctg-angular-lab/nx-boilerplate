import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';
import { IPatientHistory } from '@nx-boilerplate/api-interfaces';
import { HistorialPacientesService } from '../../services/historial-pacientes.service';
import { PacienteDemographicFormComponent } from './paciente-demographic-form.component';

describe('PacienteDemographicFormComponent', () => {
  let component: PacienteDemographicFormComponent;
  let fixture: ComponentFixture<PacienteDemographicFormComponent>;
  let mockHistorialService: {
    createPatient: ReturnType<typeof vi.fn>;
    updatePatient: ReturnType<typeof vi.fn>;
  };
  let mockDialogRef: {
    close: ReturnType<typeof vi.fn>;
  };

  const samplePatient: IPatientHistory = {
    cedula: '1020304050',
    tipo_documento: 'CC',
    nombre: 'Laura',
    apellidos: 'Restrepo',
    correo: 'laura@example.com',
    celular: '3109876543',
    fecha_nacimiento: '2010-06-15',
    edad: 15,
    sexo: 'Femenino',
    estado_civil: 'Soltero(a)',
    ocupacion: 'Estudiante',
    direccion_residencia: 'Carrera 7 # 45-12',
    aseguradora: 'Sura EPS',
    tipo_vinculacion: 'Beneficiario',
    es_menor_de_edad: true,
    acompanante: { nombre: 'María Gómez', telefono: '3001112233' },
    persona_responsable: {
      nombre: 'Carlos Restrepo',
      telefono: '3004445566',
      parentesco: 'Padre',
    },
    recomendaciones: 'Control visual anual',
    ultimosProcedimientos: [],
  };

  beforeEach(async () => {
    mockHistorialService = {
      createPatient: vi.fn(),
      updatePatient: vi.fn(),
    };
    mockDialogRef = {
      close: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [PacienteDemographicFormComponent],
      providers: [
        provideNoopAnimations(),
        { provide: HistorialPacientesService, useValue: mockHistorialService },
        { provide: MatDialogRef, useValue: mockDialogRef },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PacienteDemographicFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and initialize form with default values', () => {
    expect(component).toBeTruthy();
    expect(component.form.controls.tipo_documento.value).toBe('CC');
    expect(component.form.controls.es_menor_de_edad.value).toBe(false);
    expect(component.form.controls.edad.disabled).toBe(true);
  });

  it('should automatically compute age and mark minor when fecha_nacimiento is set', () => {
    // Set a date for a 10 year old
    const currentYear = new Date().getFullYear();
    const birthYear = currentYear - 10;
    component.form.controls.fecha_nacimiento.setValue(`${birthYear}-01-01`);

    expect(component.form.controls.edad.value).toBe(10);
    expect(component.form.controls.es_menor_de_edad.value).toBe(true);
  });

  it('should dynamically enforce persona_responsable required when es_menor_de_edad is true', () => {
    const respGroup = component.form.controls.persona_responsable;

    // Initially not minor -> not required
    expect(respGroup.valid).toBe(true);

    // Toggle minor to true
    component.form.controls.es_menor_de_edad.setValue(true);
    expect(respGroup.controls.nombre.hasError('required')).toBe(true);
    expect(respGroup.controls.telefono.hasError('required')).toBe(true);
    expect(respGroup.controls.parentesco.hasError('required')).toBe(true);
    expect(respGroup.valid).toBe(false);

    // Fill the fields
    respGroup.patchValue({
      nombre: 'Padre Tutor',
      telefono: '3000000000',
      parentesco: 'Padre',
    });
    expect(respGroup.valid).toBe(true);

    // Toggle minor back to false -> validators cleared
    component.form.controls.es_menor_de_edad.setValue(false);
    respGroup.reset();
    expect(respGroup.valid).toBe(true);
  });

  it('should patch patient data and disable cedula in edit mode', () => {
    fixture.componentRef.setInput('patient', samplePatient);
    fixture.componentRef.setInput('mode', 'edit');
    fixture.detectChanges();

    expect(component.form.controls.cedula.value).toBe('1020304050');
    expect(component.form.controls.nombre.value).toBe('Laura');
    expect(component.form.controls.cedula.disabled).toBe(true);
    expect(component.form.controls.tipo_documento.disabled).toBe(true);
  });

  it('should call createPatient on submit when in create mode', () => {
    mockHistorialService.createPatient.mockReturnValue(of(samplePatient));
    const savedSpy = vi.spyOn(component.saved, 'emit');

    // Fill minimum required fields
    component.form.patchValue({
      cedula: '1020304050',
      tipo_documento: 'CC',
      nombre: 'Laura',
      apellidos: 'Restrepo',
      correo: 'laura@example.com',
      celular: '3109876543',
      es_menor_de_edad: false,
    });

    component.onSubmit();

    expect(mockHistorialService.createPatient).toHaveBeenCalled();
    expect(savedSpy).toHaveBeenCalledWith(samplePatient);
    expect(mockDialogRef.close).toHaveBeenCalledWith(samplePatient);
  });

  it('should call updatePatient on submit when in edit mode', () => {
    fixture.componentRef.setInput('patient', samplePatient);
    fixture.componentRef.setInput('mode', 'edit');
    fixture.detectChanges();

    mockHistorialService.updatePatient.mockReturnValue(of(samplePatient));
    const savedSpy = vi.spyOn(component.saved, 'emit');

    component.onSubmit();

    expect(mockHistorialService.updatePatient).toHaveBeenCalledWith(
      '1020304050',
      expect.objectContaining({
        nombre: 'Laura',
        apellidos: 'Restrepo',
      })
    );
    expect(savedSpy).toHaveBeenCalledWith(samplePatient);
    expect(mockDialogRef.close).toHaveBeenCalledWith(samplePatient);
  });

  it('should emit cancelled and close dialog on cancel', () => {
    const cancelSpy = vi.spyOn(component.cancelled, 'emit');

    component.onCancel();

    expect(cancelSpy).toHaveBeenCalled();
    expect(mockDialogRef.close).toHaveBeenCalledWith(null);
  });
});

