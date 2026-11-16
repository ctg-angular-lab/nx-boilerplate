import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { describe, it, expect, beforeEach } from 'vitest';
import { StepPersonalInfoComponent } from './step-personal-info.component';

describe('StepPersonalInfoComponent', () => {
  let fixture: ComponentFixture<StepPersonalInfoComponent>;

  const form = new FormGroup({
    nombre: new FormControl(''),
    apellidos: new FormControl(''),
    correo: new FormControl(''),
    indicativo: new FormControl('+57'),
    numeroCelular: new FormControl(''),
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StepPersonalInfoComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StepPersonalInfoComponent);
    fixture.componentRef.setInput('form', form);
  });

  it('debe mostrar la card "Último médico tratante" con médico y recomendaciones', () => {
    fixture.componentRef.setInput('history', {
      cedula: '1',
      nombre: 'Laura',
      apellidos: 'Gómez',
      correo: 'l@g.com',
      celular: '300',
      ultimoMedicoTratante: 'Dra. María Gómez',
      recomendaciones: 'Evitar masajear la zona por 24 horas',
    });
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Último médico tratante');
    expect(text).toContain('Médico tratante: Dra. María Gómez');
    expect(text).toContain('Tratamientos y recomendaciones: Evitar masajear la zona por 24 horas');
    expect((fixture.nativeElement as HTMLElement).querySelector('.history-table')).toBeNull();
  });

  it('no debe mostrar la card cuando no hay médico ni recomendaciones', () => {
    fixture.componentRef.setInput('history', {
      cedula: '1',
      nombre: 'Laura',
      apellidos: 'Gómez',
      correo: 'l@g.com',
      celular: '300',
    });
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('.history-card')).toBeNull();
  });
});

