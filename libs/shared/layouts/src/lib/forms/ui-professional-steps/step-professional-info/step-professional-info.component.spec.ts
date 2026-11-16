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
      specialtyCategory: new FormControl(null, Validators.required),
      actoAdministrativo: new FormControl(''),
    });

    await TestBed.configureTestingModule({
      imports: [StepProfessionalInfoComponent, ReactiveFormsModule],
      providers: [provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(StepProfessionalInfoComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('stepForm', form);
    fixture.componentRef.setInput('categories', [
      {
        categoryId: 'CAT-01',
        name: 'Medicina Estética',
        slug: 'medicina-estetica',
        isActive: true,
      },
    ]);
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
      specialtyCategory: {
        categoryId: 'CAT-01',
        name: 'Medicina Estética',
        slug: 'medicina-estetica',
      },
      actoAdministrativo: 'Resolución No. 1234 de 2024',
    });
    fixture.detectChanges();

    const nextBtn = fixture.debugElement.query(By.css('.stepper-actions button:last-child'));
    expect(nextBtn.nativeElement.disabled).toBe(false);

    const nextSpy = vi.fn();
    component.nextStep.subscribe(nextSpy);

    nextBtn.nativeElement.click();
    expect(nextSpy).toHaveBeenCalledTimes(1);
  });

  it('debe comparar categorías por categoryId con compareCategories', () => {
    expect(
      component.compareCategories(
        { categoryId: 'CAT-01', name: 'Cat A', slug: 'cat-a' },
        { categoryId: 'CAT-01', name: 'Cat B', slug: 'cat-b' }
      )
    ).toBe(true);
    expect(
      component.compareCategories(
        { categoryId: 'CAT-01', name: 'Cat A', slug: 'cat-a' },
        { categoryId: 'CAT-02', name: 'Cat B', slug: 'cat-b' }
      )
    ).toBe(false);
  });

  it('debe sincronizar el control profesion al invocar onCategoryChange', () => {
    component.onCategoryChange({
      value: {
        categoryId: 'CAT-01',
        name: 'Médico Estético',
        slug: 'medico-estetico',
      },
    } as never);
    expect(form.get('profesion')?.value).toBe('Médico Estético');
  });

  it('debe emitir prevStep al pulsar Anterior', () => {
    const prevSpy = vi.fn();
    component.prevStep.subscribe(prevSpy);

    const prevBtn = fixture.debugElement.query(By.css('.stepper-actions button:first-child'));
    prevBtn.nativeElement.click();

    expect(prevSpy).toHaveBeenCalledTimes(1);
  });
});
