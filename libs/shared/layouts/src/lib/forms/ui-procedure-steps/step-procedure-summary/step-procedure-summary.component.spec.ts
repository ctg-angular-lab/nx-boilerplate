import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { ProcedureSummaryData } from '../../../models/procedure-steps.models';
import { StepProcedureSummaryComponent } from './step-procedure-summary.component';

describe('StepProcedureSummaryComponent', () => {
  let component: StepProcedureSummaryComponent;
  let fixture: ComponentFixture<StepProcedureSummaryComponent>;

  const mockData: ProcedureSummaryData = {
    nombreProcedimiento: 'Rinoplastia Estética',
    valorStandar: 3500000,
    duracionStandar: 120,
    laboratorios: [
      {
        nombreLaboratorio: 'Set de Osteótomos',
        precio: 150000,
        medidaPorUnidad: 'Kit',
      },
      {
        nombreLaboratorio: 'Férula Nasal Termoplástica',
        precio: 80000,
        medidaPorUnidad: 'Unidad',
      },
    ],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StepProcedureSummaryComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(StepProcedureSummaryComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('summaryData', mockData);
    fixture.detectChanges();
  });

  it('debe crearse y renderizar los datos del resumen', () => {
    expect(component).toBeTruthy();

    const titleEl = fixture.debugElement.query(By.css('.procedure-title'));
    expect(titleEl.nativeElement.textContent).toContain('Rinoplastia Estética');

    const metricsValues = fixture.debugElement.queryAll(By.css('.metric-value'));
    expect(metricsValues[0].nativeElement.textContent).toContain('3.500.000');
    expect(metricsValues[1].nativeElement.textContent).toContain('120 min');
    expect(metricsValues[2].nativeElement.textContent).toContain('2 insumo(s)');

    const labRows = fixture.debugElement.queryAll(By.css('.table-row'));
    expect(labRows.length).toBe(2);
  });

  it('debe emitir prevStep al pulsar Anterior', () => {
    const prevSpy = vi.fn();
    component.prevStep.subscribe(prevSpy);

    const prevBtn = fixture.debugElement.query(By.css('.stepper-actions button:first-child'));
    prevBtn.nativeElement.click();

    expect(prevSpy).toHaveBeenCalledTimes(1);
  });

  it('debe emitir save al pulsar Guardar Procedimiento', () => {
    const saveSpy = vi.fn();
    component.save.subscribe(saveSpy);

    const saveBtn = fixture.debugElement.query(By.css('.stepper-actions button:last-child'));
    expect(saveBtn.nativeElement.textContent).toContain('Guardar Procedimiento');

    saveBtn.nativeElement.click();
    expect(saveSpy).toHaveBeenCalledTimes(1);
  });

  it('debe mostrar banner de reactivación y botón con texto Reactivar Procedimiento cuando isRestoringInactive es true', () => {
    fixture.componentRef.setInput('isRestoringInactive', true);
    fixture.detectChanges();

    const alertBanner = fixture.debugElement.query(By.css('.restore-alert-banner'));
    expect(alertBanner).toBeTruthy();
    expect(alertBanner.nativeElement.textContent).toContain('previamente inactivo');

    const saveBtn = fixture.debugElement.query(By.css('.stepper-actions button:last-child'));
    expect(saveBtn.nativeElement.textContent).toContain('Reactivar Procedimiento');
  });

  it('debe mostrar Actualizar Procedimiento cuando isEditMode es true', () => {
    fixture.componentRef.setInput('isEditMode', true);
    fixture.detectChanges();

    const saveBtn = fixture.debugElement.query(By.css('.stepper-actions button:last-child'));
    expect(saveBtn.nativeElement.textContent).toContain('Actualizar Procedimiento');
  });

  it('debe deshabilitar botones y mostrar estado guardando cuando isSaving es true', () => {
    fixture.componentRef.setInput('isSaving', true);
    fixture.detectChanges();

    const buttons = fixture.debugElement.queryAll(By.css('.stepper-actions button'));
    expect(buttons[0].nativeElement.disabled).toBe(true);
    expect(buttons[1].nativeElement.disabled).toBe(true);
    expect(buttons[1].nativeElement.textContent).toContain('Guardando...');
  });
});
