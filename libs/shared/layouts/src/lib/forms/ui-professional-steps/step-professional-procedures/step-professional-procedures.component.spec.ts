import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { IProcedure } from '@nx-boilerplate/api-interfaces';
import { StepProfessionalProceduresComponent } from './step-professional-procedures.component';

const mockProcedures: IProcedure[] = [
  {
    idProcedimiento: 'P1',
    nombreProcedimiento: 'Rejuvenecimiento Facial',
    valorStandar: 250000,
    duracionStandar: 45,
    medicosRelacionados: [],
  },
  {
    idProcedimiento: 'P2',
    nombreProcedimiento: 'Toxina Botulínica',
    valorStandar: 400000,
    duracionStandar: 30,
    medicosRelacionados: [],
  },
];

describe('StepProfessionalProceduresComponent', () => {
  let component: StepProfessionalProceduresComponent;
  let fixture: ComponentFixture<StepProfessionalProceduresComponent>;
  let form: FormGroup;

  beforeEach(async () => {
    form = new FormGroup({
      procedimientosRelacionados: new FormControl<string[]>([]),
    });

    await TestBed.configureTestingModule({
      imports: [StepProfessionalProceduresComponent, ReactiveFormsModule],
      providers: [provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(StepProfessionalProceduresComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('stepForm', form);
    fixture.componentRef.setInput('procedures', mockProcedures);
    fixture.detectChanges();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe emitir prevStep al pulsar Anterior', () => {
    const prevSpy = vi.fn();
    component.prevStep.subscribe(prevSpy);

    const prevBtn = fixture.debugElement.query(By.css('.stepper-actions button:first-child'));
    prevBtn.nativeElement.click();

    expect(prevSpy).toHaveBeenCalledTimes(1);
  });

  it('debe emitir save al pulsar Guardar Profesional', () => {
    const saveSpy = vi.fn();
    component.save.subscribe(saveSpy);

    const saveBtn = fixture.debugElement.query(By.css('.stepper-actions button:last-child'));
    saveBtn.nativeElement.click();

    expect(saveSpy).toHaveBeenCalledTimes(1);
  });

  it('debe deshabilitar el botón de envío cuando isSaving es true', () => {
    fixture.componentRef.setInput('isSaving', true);
    fixture.detectChanges();

    const saveBtn = fixture.debugElement.query(By.css('.stepper-actions button:last-child'));
    expect(saveBtn.nativeElement.disabled).toBe(true);
    expect(saveBtn.nativeElement.textContent).toContain('Guardando...');
  });

  it('debe mostrar "Actualizar Profesional" cuando isEditMode es true', () => {
    fixture.componentRef.setInput('isEditMode', true);
    fixture.detectChanges();

    const saveBtn = fixture.debugElement.query(By.css('.stepper-actions button:last-child'));
    expect(saveBtn.nativeElement.textContent).toContain('Actualizar Profesional');
  });

  it('debe renderizar la tarjeta de resumen cuando summaryData está presente', () => {
    expect(fixture.debugElement.query(By.css('.summary-card'))).toBeNull();

    fixture.componentRef.setInput('summaryData', {
      cedula: '98765432',
      nombres: 'Alejandro',
      apellidos: 'Morales',
      email: 'amorales@clinica.com',
      profesion: 'Cirujano Plástico',
      diasLaborales: ['LUNES', 'MIERCOLES', 'VIERNES'],
      horaInicio: '08:00',
      horaFin: '16:00',
      receso: '12:00 – 13:00',
    });
    fixture.detectChanges();

    const summaryCard = fixture.debugElement.query(By.css('.summary-card'));
    expect(summaryCard).not.toBeNull();
    expect(summaryCard.nativeElement.textContent).toContain('Alejandro Morales');
    expect(summaryCard.nativeElement.textContent).toContain('98765432');
    expect(summaryCard.nativeElement.textContent).toContain('Cirujano Plástico');
  });
});
