import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { computed, signal } from '@angular/core';
import { of } from 'rxjs';
import { IActiveProfessional, IProcedure } from '@nx-boilerplate/api-interfaces';
import { ProfesionalesAdminService } from '../../services/profesionales-admin.service';
import { scheduleRangeValidator } from '../../utils/schedule.validator';
import { ProfesionalesFormComponent } from './profesionales-form.component';

const mockProfessional: IActiveProfessional = {
  cedula: '12345678',
  nombres: 'Laura',
  apellidos: 'Gómez',
  email: 'laura@clinica.com',
  profesion: 'Médica General',
  isActive: true,
  horarioTrabajo: {
    diasLaborales: ['LUNES', 'MARTES'],
    horaInicio: '08:00',
    horaFin: '17:00',
    recesoAlmuerzo: { inicio: '12:00', fin: '13:00' },
  },
  procedimientosRelacionados: ['P1'],
};

describe('ProfesionalesFormComponent', () => {
  let component: ProfesionalesFormComponent;
  let fixture: ComponentFixture<ProfesionalesFormComponent>;

  let mockEditingSignal = signal<IActiveProfessional | null>(null);
  let mockListSignal = signal<IActiveProfessional[]>([mockProfessional]);
  let mockIsSavingSignal = signal<boolean>(false);
  let mockSaveErrorSignal = signal<string | null>(null);
  let mockProceduresSignal = signal<IProcedure[]>([]);

  let mockService: {
    editingProfessional: typeof mockEditingSignal;
    profesionalesList: typeof mockListSignal;
    isSaving: typeof mockIsSavingSignal;
    saveError: typeof mockSaveErrorSignal;
    procedures: typeof mockProceduresSignal;
    isEditMode: ReturnType<typeof computed<boolean>>;
    createProfesional: ReturnType<typeof vi.fn>;
    updateProfesional: ReturnType<typeof vi.fn>;
    goToList: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    mockEditingSignal = signal<IActiveProfessional | null>(null);
    mockListSignal = signal<IActiveProfessional[]>([mockProfessional]);
    mockIsSavingSignal = signal<boolean>(false);
    mockSaveErrorSignal = signal<string | null>(null);
    mockProceduresSignal = signal<IProcedure[]>([]);

    mockService = {
      editingProfessional: mockEditingSignal,
      profesionalesList: mockListSignal,
      isSaving: mockIsSavingSignal,
      saveError: mockSaveErrorSignal,
      procedures: mockProceduresSignal,
      isEditMode: computed(() => mockEditingSignal() !== null),
      createProfesional: vi.fn().mockReturnValue(of(mockProfessional)),
      updateProfesional: vi.fn().mockReturnValue(of(mockProfessional)),
      goToList: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ProfesionalesFormComponent],
      providers: [
        provideNoopAnimations(),
        { provide: ProfesionalesAdminService, useValue: mockService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfesionalesFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('1. Creación y Estado Inicial', () => {
    it('debe crearse correctamente con los valores por defecto del formulario', () => {
      expect(component).toBeTruthy();
      expect(component.form.controls.step1.controls.cedula.value).toBe('');
      expect(component.form.controls.step3.controls.horaInicio.value).toBe('08:00');
      expect(component.form.controls.step3.controls.horaFin.value).toBe('17:00');
      expect(component.form.controls.step3.controls.tieneReceso.value).toBe(false);
      expect(component.form.controls.step3.controls.diasLaborales.value).toEqual([
        'LUNES',
        'MARTES',
        'MIERCOLES',
        'JUEVES',
        'VIERNES',
      ]);
    });

    it('no debe borrar el documento ni resetear el formulario al tipear en modo creación', () => {
      // 1. Simular escritura de los primeros 6 dígitos (inválido según pattern ^\d{7,15}$)
      component.form.controls.step1.controls.cedula.setValue('234567');
      fixture.detectChanges();
      expect(component.form.controls.step1.controls.cedula.value).toBe('234567');
      expect(component.form.controls.step1.valid).toBe(false);

      // 2. Simular escritura del 7mo dígito ('0') alcanzando validez (2345670)
      component.form.controls.step1.controls.cedula.setValue('2345670');
      fixture.detectChanges();

      // El valor debe mantenerse íntegro y el formulario no debe haberse reseteado
      expect(component.form.controls.step1.controls.cedula.value).toBe('2345670');
      expect(component.form.controls.step1.valid).toBe(true);
    });

    it('debe sincronizar correctamente entre modo edición y regreso a modo creación', () => {
      // 1. Pasar a modo edición
      mockEditingSignal.set(mockProfessional);
      fixture.detectChanges();

      expect(component.form.controls.step1.controls.cedula.value).toBe('12345678');
      expect(component.form.controls.step2.controls.nombres.value).toBe('Laura');

      // 2. Regresar a modo creación (editingProfessional = null)
      mockEditingSignal.set(null);
      fixture.detectChanges();

      expect(component.form.controls.step1.controls.cedula.value).toBe('');
      expect(component.form.controls.step2.controls.nombres.value).toBe('');
    });
  });

  describe('2. scheduleRangeValidator (Paso 3)', () => {
    it('debe retornar invalidWorkRange si horaInicio >= horaFin', () => {
      const step3 = component.form.controls.step3;
      step3.patchValue({ horaInicio: '17:00', horaFin: '08:00' });
      const error = scheduleRangeValidator(step3);
      expect(error).toEqual({ invalidWorkRange: true });
    });

    it('debe retornar invalidLunchRange si inicio de almuerzo >= fin de almuerzo cuando tieneReceso es true', () => {
      const step3 = component.form.controls.step3;
      step3.patchValue({
        horaInicio: '08:00',
        horaFin: '17:00',
        tieneReceso: true,
        recesoAlmuerzo: { inicio: '13:00', fin: '12:00' },
      });
      const error = scheduleRangeValidator(step3);
      expect(error).toEqual({ invalidLunchRange: true });
    });

    it('debe retornar lunchOutsideWorkHours si el almuerzo no está contenido en la jornada laboral', () => {
      const step3 = component.form.controls.step3;
      step3.patchValue({
        horaInicio: '09:00',
        horaFin: '17:00',
        tieneReceso: true,
        recesoAlmuerzo: { inicio: '08:00', fin: '10:00' },
      });
      const error = scheduleRangeValidator(step3);
      expect(error).toEqual({ lunchOutsideWorkHours: true });
    });

    it('debe retornar null cuando el horario laboral y de receso son consistentes', () => {
      const step3 = component.form.controls.step3;
      step3.patchValue({
        horaInicio: '08:00',
        horaFin: '17:00',
        tieneReceso: true,
        recesoAlmuerzo: { inicio: '12:00', fin: '13:00' },
      });
      const error = scheduleRangeValidator(step3);
      expect(error).toBeNull();
    });
  });

  describe('3. Validación de Cédula Duplicada en Paso 1', () => {
    it('debe bloquear el avance y marcar duplicateCedula si la cédula ya existe en la lista', () => {
      component.form.controls.step1.controls.cedula.setValue('12345678');
      component.onStep1Next();

      expect(component.form.controls.step1.controls.cedula.hasError('duplicateCedula')).toBe(true);
    });

    it('no debe marcar duplicateCedula si la cédula es nueva', () => {
      component.form.controls.step1.controls.cedula.setValue('99999999');
      component.onStep1Next();

      expect(component.form.controls.step1.controls.cedula.hasError('duplicateCedula')).toBe(false);
    });
  });

  describe('4. Guardado en Modo Creación (onSubmit)', () => {
    it('debe construir un payload limpio sin tieneReceso y con recesoAlmuerzo undefined cuando el toggle está apagado', () => {
      component.form.controls.step1.setValue({ cedula: '87654321' });
      component.form.controls.step2.setValue({
        nombres: 'Andrés',
        apellidos: 'Restrepo',
        email: 'andres@clinica.com',
        profesion: 'Cirujano',
      });
      component.form.controls.step3.patchValue({
        diasLaborales: ['LUNES', 'MIERCOLES'],
        horaInicio: '08:00',
        horaFin: '16:00',
        tieneReceso: false,
      });

      component.onSubmit();

      expect(mockService.createProfesional).toHaveBeenCalledWith({
        cedula: '87654321',
        nombres: 'Andrés',
        apellidos: 'Restrepo',
        email: 'andres@clinica.com',
        profesion: 'Cirujano',
        horarioTrabajo: {
          diasLaborales: ['LUNES', 'MIERCOLES'],
          horaInicio: '08:00',
          horaFin: '16:00',
        },
      });
    });

    it('debe incluir recesoAlmuerzo si tieneReceso es true', () => {
      component.form.controls.step1.setValue({ cedula: '87654321' });
      component.form.controls.step2.setValue({
        nombres: 'Andrés',
        apellidos: 'Restrepo',
        email: 'andres@clinica.com',
        profesion: 'Cirujano',
      });
      component.form.controls.step3.setValue({
        diasLaborales: ['LUNES'],
        horaInicio: '08:00',
        horaFin: '16:00',
        tieneReceso: true,
        recesoAlmuerzo: { inicio: '12:00', fin: '13:00' },
      });

      component.onSubmit();

      expect(mockService.createProfesional).toHaveBeenCalledWith(
        expect.objectContaining({
          horarioTrabajo: {
            diasLaborales: ['LUNES'],
            horaInicio: '08:00',
            horaFin: '16:00',
            recesoAlmuerzo: { inicio: '12:00', fin: '13:00' },
          },
        })
      );
    });
  });

  describe('5. Modo Edición', () => {
    it('debe poblar el formulario, deshabilitar cédula e invocar updateProfesional al guardar', () => {
      mockEditingSignal.set(mockProfessional);
      fixture.detectChanges();

      expect(component.form.controls.step1.controls.cedula.disabled).toBe(true);
      expect(component.form.controls.step1.controls.cedula.value).toBe(mockProfessional.cedula);
      expect(component.form.controls.step2.controls.nombres.value).toBe(mockProfessional.nombres);

      component.form.controls.step2.controls.nombres.setValue('Laura Cristina');
      component.onSubmit();

      expect(mockService.updateProfesional).toHaveBeenCalledWith(
        '12345678',
        expect.objectContaining({
          nombres: 'Laura Cristina',
          apellidos: 'Gómez',
          email: 'laura@clinica.com',
        })
      );
    });
  });

  describe('6. Cancelación y Reset', () => {
    it('onCancel debe restablecer el formulario y llamar a goToList()', () => {
      component.form.controls.step2.controls.nombres.setValue('Nombre Modificado');
      component.onCancel();

      expect(mockService.goToList).toHaveBeenCalledTimes(1);
      expect(component.form.controls.step2.controls.nombres.value).toBe('');
    });
  });
});
