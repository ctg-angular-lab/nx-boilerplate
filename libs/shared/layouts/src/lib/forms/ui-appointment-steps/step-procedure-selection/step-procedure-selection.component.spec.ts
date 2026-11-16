import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach } from 'vitest';
import { IProcedure } from '@nx-boilerplate/api-interfaces';
import { StepProcedureSelectionComponent } from './step-procedure-selection.component';

describe('StepProcedureSelectionComponent', () => {
  let fixture: ComponentFixture<StepProcedureSelectionComponent>;
  let form: FormGroup;

  const procedures: IProcedure[] = [
    {
      idProcedimiento: 'PROC-EST-010',
      nombreProcedimiento: 'Control Postprocedimiento',
      valorStandar: 0,
      duracionStandar: 20,
      medicosRelacionados: ['71345678'],
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StepProcedureSelectionComponent, NoopAnimationsModule],
    }).compileComponents();

    form = new FormGroup({ procedimientoId: new FormControl('') });
    fixture = TestBed.createComponent(StepProcedureSelectionComponent);
    fixture.componentRef.setInput('form', form);
    fixture.componentRef.setInput('procedures', procedures);
  });

  it('debe reflejar en el buscador un procedimiento preseleccionado programáticamente', () => {
    fixture.detectChanges();
    form.get('procedimientoId')?.setValue('PROC-EST-010');
    fixture.detectChanges();

    expect(fixture.componentInstance.searchControl.value).toBe('Control Postprocedimiento');
    expect(fixture.componentInstance.selectedProcedureName()).toBe('Control Postprocedimiento');
  });

  it('debe limpiar el buscador cuando el formulario se reinicia', () => {
    fixture.detectChanges();
    form.get('procedimientoId')?.setValue('PROC-EST-010');
    form.reset();
    fixture.detectChanges();

    expect(fixture.componentInstance.searchControl.value).toBe('');
  });
});

