import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect } from 'vitest';
import { OtherCalendarsCardComponent } from './other-calendars-card.component';
import { IDashboardDoctor } from '../../models/dashboard.models';
import { assignDoctorColorTheme } from '../../utils/dashboard-calendar.mapper';

describe('OtherCalendarsCardComponent', () => {
  let component: OtherCalendarsCardComponent;
  let fixture: ComponentFixture<OtherCalendarsCardComponent>;

  const mockDoctors: IDashboardDoctor[] = [
    {
      cedula: '1002',
      nombres: 'Beatriz',
      apellidos: 'Pinzón',
      fullName: 'Dr(a). Beatriz Pinzón',
      initials: 'BP',
      email: 'bp@clinica.com',
      profesion: 'Dermatología',
      colorTheme: assignDoctorColorTheme(1),
      horarioTrabajo: {
        diasLaborales: ['Lunes'],
        horaInicio: '08:00',
        horaFin: '17:00',
      },
    },
    {
      cedula: '1003',
      nombres: 'Carlos',
      apellidos: 'Sarmiento',
      fullName: 'Dr(a). Carlos Sarmiento',
      initials: 'CS',
      email: 'cs@clinica.com',
      profesion: 'Ortopedia',
      colorTheme: assignDoctorColorTheme(2),
      horarioTrabajo: {
        diasLaborales: ['Lunes'],
        horaInicio: '08:00',
        horaFin: '17:00',
      },
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OtherCalendarsCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(OtherCalendarsCardComponent);
    component = fixture.componentInstance;
  });

  it('debe crearse y renderizar la lista de médicos', () => {
    fixture.componentRef.setInput('doctors', mockDoctors);
    fixture.componentRef.setInput('selectedCedulas', ['1002']);
    fixture.detectChanges();

    expect(component).toBeTruthy();
    expect(component.isChecked('1002')).toBe(true);
    expect(component.isChecked('1003')).toBe(false);

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Beatriz Pinzón');
    expect(compiled.textContent).toContain('Carlos Sarmiento');
  });

  it('debe emitir toggleDoctor al hacer clic en un profesional', () => {
    fixture.componentRef.setInput('doctors', mockDoctors);
    fixture.componentRef.setInput('selectedCedulas', []);
    fixture.detectChanges();

    let toggledCedula: string | null = null;
    component.toggleDoctor.subscribe((cedula) => {
      toggledCedula = cedula;
    });

    component.onToggle('1003');
    expect(toggledCedula).toBe('1003');
  });

  it('debe emitir clearAll al presionar el botón Limpiar', () => {
    fixture.componentRef.setInput('doctors', mockDoctors);
    fixture.componentRef.setInput('selectedCedulas', ['1002']);
    fixture.detectChanges();

    let cleared = false;
    component.clearAll.subscribe(() => {
      cleared = true;
    });

    component.onClear();
    expect(cleared).toBe(true);
  });
});

