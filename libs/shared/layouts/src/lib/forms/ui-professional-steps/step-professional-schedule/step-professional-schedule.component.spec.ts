import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { StepProfessionalScheduleComponent } from './step-professional-schedule.component';

describe('StepProfessionalScheduleComponent', () => {
  let component: StepProfessionalScheduleComponent;
  let fixture: ComponentFixture<StepProfessionalScheduleComponent>;
  let form: FormGroup;

  beforeEach(async () => {
    form = new FormGroup({
      diasLaborales: new FormControl<string[]>([], Validators.required),
      horaInicio: new FormControl('', Validators.required),
      horaFin: new FormControl('', Validators.required),
      tieneReceso: new FormControl(false),
      recesoAlmuerzo: new FormGroup({
        inicio: new FormControl(''),
        fin: new FormControl(''),
      }),
    });

    await TestBed.configureTestingModule({
      imports: [StepProfessionalScheduleComponent, ReactiveFormsModule],
      providers: [provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(StepProfessionalScheduleComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('stepForm', form);
    fixture.detectChanges();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe deshabilitar el botón Siguiente cuando no hay días laborales seleccionados', () => {
    const nextBtn = fixture.debugElement.query(By.css('.stepper-actions button:last-child'));
    expect(nextBtn.nativeElement.disabled).toBe(true);
  });

  it('debe habilitar el botón Siguiente y emitir nextStep al completarse el horario base', () => {
    form.patchValue({
      diasLaborales: ['LUNES', 'MIERCOLES'],
      horaInicio: '08:00',
      horaFin: '17:00',
    });
    fixture.detectChanges();

    const nextBtn = fixture.debugElement.query(By.css('.stepper-actions button:last-child'));
    expect(nextBtn.nativeElement.disabled).toBe(false);

    const nextSpy = vi.fn();
    component.nextStep.subscribe(nextSpy);
    nextBtn.nativeElement.click();

    expect(nextSpy).toHaveBeenCalledTimes(1);
  });

  it('debe emitir prevStep al pulsar Anterior', () => {
    const prevSpy = vi.fn();
    component.prevStep.subscribe(prevSpy);

    const prevBtn = fixture.debugElement.query(By.css('.stepper-actions button:first-child'));
    prevBtn.nativeElement.click();

    expect(prevSpy).toHaveBeenCalledTimes(1);
  });

  it('debe mostrar los campos de almuerzo cuando tieneReceso es true', () => {
    expect(fixture.debugElement.query(By.css('.lunch-group'))).toBeNull();

    form.get('tieneReceso')?.setValue(true);
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('.lunch-group'))).not.toBeNull();
  });
});
