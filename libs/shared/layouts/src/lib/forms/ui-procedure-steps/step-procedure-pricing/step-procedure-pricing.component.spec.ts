import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { StepProcedurePricingComponent } from './step-procedure-pricing.component';

describe('StepProcedurePricingComponent', () => {
  let component: StepProcedurePricingComponent;
  let fixture: ComponentFixture<StepProcedurePricingComponent>;
  let form: FormGroup;
  let labsArray: FormArray<FormGroup>;

  const createLabGroup = (nombre = '', precio: number | null = null, medida = '') =>
    new FormGroup({
      nombreLaboratorio: new FormControl(nombre, [Validators.required, Validators.minLength(2)]),
      precio: new FormControl(precio, [Validators.required, Validators.min(0)]),
      medidaPorUnidad: new FormControl(medida, Validators.required),
    });

  beforeEach(async () => {
    labsArray = new FormArray<FormGroup>([]);
    form = new FormGroup({
      valorStandar: new FormControl<number | null>(null, [Validators.required, Validators.min(0)]),
      duracionStandar: new FormControl<number | null>(null, [
        Validators.required,
        Validators.min(5),
        Validators.max(480),
      ]),
      tieneLaboratorio: new FormControl<boolean>(false),
      laboratorios: labsArray,
    });

    await TestBed.configureTestingModule({
      imports: [StepProcedurePricingComponent, ReactiveFormsModule],
      providers: [provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(StepProcedurePricingComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('stepForm', form);
    fixture.detectChanges();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe deshabilitar el botón Continuar cuando los campos de precios son inválidos', () => {
    const nextBtn = fixture.debugElement.query(By.css('.stepper-actions button:last-child'));
    expect(nextBtn.nativeElement.disabled).toBe(true);
  });

  it('debe emitir prevStep al hacer click en Anterior', () => {
    const prevSpy = vi.fn();
    component.prevStep.subscribe(prevSpy);

    const prevBtn = fixture.debugElement.query(By.css('.stepper-actions button:first-child'));
    prevBtn.nativeElement.click();

    expect(prevSpy).toHaveBeenCalledTimes(1);
  });

  it('debe habilitar Continuar y emitir nextStep cuando el formulario es válido sin laboratorios', () => {
    form.patchValue({
      valorStandar: 200000,
      duracionStandar: 45,
      tieneLaboratorio: false,
    });
    fixture.detectChanges();

    const nextBtn = fixture.debugElement.query(By.css('.stepper-actions button:last-child'));
    expect(nextBtn.nativeElement.disabled).toBe(false);

    const nextSpy = vi.fn();
    component.nextStep.subscribe(nextSpy);

    nextBtn.nativeElement.click();
    expect(nextSpy).toHaveBeenCalledTimes(1);
  });

  it('debe emitir addLaboratory al pulsar el botón de agregar laboratorio', () => {
    form.patchValue({ tieneLaboratorio: true });
    fixture.detectChanges();

    const addSpy = vi.fn();
    component.addLaboratory.subscribe(addSpy);

    const addBtn = fixture.debugElement.query(By.css('.add-lab-button'));
    expect(addBtn).toBeTruthy();
    addBtn.nativeElement.click();

    expect(addSpy).toHaveBeenCalledTimes(1);
  });

  it('debe emitir removeLaboratory con el índice correspondiente al pulsar el botón de eliminar', () => {
    labsArray.push(createLabGroup('Insumo 1', 10000, 'Unidad'));
    labsArray.push(createLabGroup('Insumo 2', 25000, 'Ampolla'));
    form.patchValue({ tieneLaboratorio: true });
    fixture.detectChanges();

    const removeSpy = vi.fn();
    component.removeLaboratory.subscribe(removeSpy);

    const deleteButtons = fixture.debugElement.queryAll(
      By.css('button[aria-label="Eliminar laboratorio"]')
    );
    expect(deleteButtons.length).toBe(2);

    deleteButtons[1].nativeElement.click();
    expect(removeSpy).toHaveBeenCalledWith(1);
  });
});
