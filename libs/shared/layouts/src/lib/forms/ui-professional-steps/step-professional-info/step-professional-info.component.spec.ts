import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { StepProfessionalInfoComponent } from './step-professional-info.component';

describe('StepProfessionalInfoComponent', () => {
  let component: StepProfessionalInfoComponent;
  let fixture: ComponentFixture<StepProfessionalInfoComponent>;
  let form: FormGroup;

  beforeEach(async () => {
    form = new FormGroup({
      nombres: new FormControl('', Validators.required),
      apellidos: new FormControl('', Validators.required),
      email: new FormControl('', [Validators.required, Validators.email]),
      profesion: new FormControl('', Validators.required),
    });

    await TestBed.configureTestingModule({
      imports: [StepProfessionalInfoComponent, ReactiveFormsModule],
      providers: [provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(StepProfessionalInfoComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('stepForm', form);
    fixture.detectChanges();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe deshabilitar el botón Siguiente cuando el formulario es inválido', () => {
    const nextBtn = fixture.debugElement.query(By.css('.stepper-actions button:last-child'));
    expect(nextBtn.nativeElement.disabled).toBe(true);
  });

  it('debe habilitar el botón Siguiente y emitir nextStep al pulsarlo cuando el formulario es válido', () => {
    form.setValue({
      nombres: 'Mariana',
      apellidos: 'Botero Giraldo',
      email: 'mariana.botero@clinica.com',
      profesion: 'Medicina Estética',
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
});
