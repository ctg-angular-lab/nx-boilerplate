import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { StepProcedureNameComponent } from './step-procedure-name.component';

describe('StepProcedureNameComponent', () => {
  let component: StepProcedureNameComponent;
  let fixture: ComponentFixture<StepProcedureNameComponent>;
  let form: FormGroup;

  beforeEach(async () => {
    form = new FormGroup({
      nombreProcedimiento: new FormControl('', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(100),
      ]),
    });

    await TestBed.configureTestingModule({
      imports: [StepProcedureNameComponent, ReactiveFormsModule],
      providers: [provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(StepProcedureNameComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('stepForm', form);
    fixture.detectChanges();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe deshabilitar el botón Continuar cuando el nombre es inválido', () => {
    const nextBtn = fixture.debugElement.query(By.css('.stepper-actions button'));
    expect(nextBtn.nativeElement.disabled).toBe(true);
  });

  it('debe habilitar el botón y emitir nextStep cuando el formulario es válido', () => {
    form.setValue({ nombreProcedimiento: 'Blefaroplastia Superior' });
    fixture.detectChanges();

    const nextBtn = fixture.debugElement.query(By.css('.stepper-actions button'));
    expect(nextBtn.nativeElement.disabled).toBe(false);

    const nextSpy = vi.fn();
    component.nextStep.subscribe(nextSpy);

    nextBtn.nativeElement.click();
    expect(nextSpy).toHaveBeenCalledTimes(1);
  });

  it('debe mostrar error de nombre duplicado cuando se establece el error duplicateName', () => {
    const control = form.get('nombreProcedimiento');
    control?.setValue('Rinoplastia');
    control?.setErrors({ duplicateName: true });
    control?.markAsTouched();
    fixture.detectChanges();

    const errorEl = fixture.debugElement.query(By.css('mat-error'));
    expect(errorEl).toBeTruthy();
    expect(errorEl.nativeElement.textContent).toContain('Ya existe un procedimiento activo');
  });
});
