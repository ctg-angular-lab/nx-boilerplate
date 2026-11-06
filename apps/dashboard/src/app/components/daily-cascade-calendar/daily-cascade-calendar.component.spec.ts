import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect } from 'vitest';
import { DailyCascadeCalendarComponent } from './daily-cascade-calendar.component';
import { IDashboardDoctor, IDashboardTimeRow } from '../../models/dashboard.models';
import { assignDoctorColorTheme, calculateOverlayGeometry } from '../../utils/dashboard-calendar.mapper';

describe('DailyCascadeCalendarComponent', () => {
  let component: DailyCascadeCalendarComponent;
  let fixture: ComponentFixture<DailyCascadeCalendarComponent>;

  const mockDoctor: IDashboardDoctor = {
    cedula: '1001',
    nombres: 'Alejandro',
    apellidos: 'Gómez',
    fullName: 'Dr(a). Alejandro Gómez',
    initials: 'AG',
    email: 'ag@clinica.com',
    profesion: 'Medicina General',
    colorTheme: assignDoctorColorTheme(0),
    horarioTrabajo: {
      diasLaborales: ['Lunes'],
      horaInicio: '08:00',
      horaFin: '17:00',
    },
  };

  const mockRows: IDashboardTimeRow[] = [
    {
      timeLabel: '08:00',
      startMinutes: 480,
      endMinutes: 510,
      layers: [
        {
          doctorCedula: '1001',
          doctorName: 'Dr(a). Alejandro Gómez',
          doctorInitials: 'AG',
          specialty: 'Medicina General',
          colorCssVar: 'var(--sys-color-primary)',
          isPrimary: true,
          status: 'CONFIRMED',
          statusLabel: 'Confirmada',
          procedureTitle: 'Consulta General',
          patientName: 'María Pérez',
          geometry: calculateOverlayGeometry(0, 1),
        },
      ],
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DailyCascadeCalendarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DailyCascadeCalendarComponent);
    component = fixture.componentInstance;
  });

  it('debe crearse y renderizar la grilla y la leyenda de médicos', () => {
    fixture.componentRef.setInput('selectedDate', new Date('2026-11-06T12:00:00'));
    fixture.componentRef.setInput('overlayDoctors', [mockDoctor]);
    fixture.componentRef.setInput('timeGridRows', mockRows);
    fixture.detectChanges();

    expect(component).toBeTruthy();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Calendario fecha actual');
    expect(compiled.textContent).toContain('08:00');
    expect(compiled.textContent).toContain('Consulta General');
    expect(compiled.textContent).toContain('María Pérez');
  });

  it('debe emitir navigateDay (-1 o +1) al hacer clic en controles', () => {
    let emittedOffset: number | null = null;
    component.navigateDay.subscribe((offset) => {
      emittedOffset = offset;
    });

    component.onPrevDay();
    expect(emittedOffset).toBe(-1);

    component.onNextDay();
    expect(emittedOffset).toBe(1);
  });

  it('debe emitir goToToday al presionar el botón Hoy', () => {
    let todayClicked = false;
    component.goToToday.subscribe(() => {
      todayClicked = true;
    });

    component.onToday();
    expect(todayClicked).toBe(true);
  });

  it('debe emitir slotClick al seleccionar un slot', () => {
    let clickedSlot: unknown = null;
    component.slotClick.subscribe((cell) => {
      clickedSlot = cell;
    });

    component.onSlotSelect(mockRows[0].layers[0]);
    expect(clickedSlot).toEqual(mockRows[0].layers[0]);
  });
});

