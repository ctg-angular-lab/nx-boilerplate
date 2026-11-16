import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, afterEach } from 'vitest';
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
    fixture.componentRef.setInput('selectedDate', new Date('2026-11-06T12:00:00'));
    fixture.componentRef.setInput('overlayDoctors', [mockDoctor]);
    fixture.componentRef.setInput('timeGridRows', mockRows);
  });

  it('debe crearse y renderizar la grilla y la leyenda de médicos', () => {
    fixture.componentRef.setInput('selectedDate', new Date('2026-11-06T12:00:00'));
    fixture.componentRef.setInput('overlayDoctors', [mockDoctor]);
    fixture.componentRef.setInput('timeGridRows', mockRows);
    fixture.detectChanges();

    expect(component).toBeTruthy();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Calendario — Viernes, 6 de noviembre');
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

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debe renderizar la línea roja punteada (.current-time-indicator) cuando la hora actual está dentro del horario laboral', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-06T08:15:00-05:00'));

    const timedFixture = TestBed.createComponent(DailyCascadeCalendarComponent);
    timedFixture.componentRef.setInput('selectedDate', new Date('2026-11-06T12:00:00-05:00'));
    timedFixture.componentRef.setInput('overlayDoctors', [mockDoctor]);
    timedFixture.componentRef.setInput('timeGridRows', mockRows);
    timedFixture.detectChanges();

    const compiled = timedFixture.nativeElement as HTMLElement;
    const indicator = compiled.querySelector('.current-time-indicator') as HTMLElement;
    expect(indicator).toBeTruthy();
    expect(indicator.style.top).toBe('50%');
    expect(indicator.getAttribute('aria-label')).toBe('Hora actual: 08:15');
  });

  it('no debe renderizar .current-time-indicator cuando la hora actual está fuera del horario laboral', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-06T20:00:00-05:00'));

    const timedFixture = TestBed.createComponent(DailyCascadeCalendarComponent);
    timedFixture.componentRef.setInput('selectedDate', new Date('2026-11-06T12:00:00-05:00'));
    timedFixture.componentRef.setInput('overlayDoctors', [mockDoctor]);
    timedFixture.componentRef.setInput('timeGridRows', mockRows);
    timedFixture.detectChanges();

    const compiled = timedFixture.nativeElement as HTMLElement;
    const indicator = compiled.querySelector('.current-time-indicator');
    expect(indicator).toBeNull();
  });

  it('debe mantener habilitado el bloque de 30 min actual mientras no haya finalizado (Opción B: row.endMinutes > currentMinutes)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-06T08:15:00-05:00'));

    const availableRows: IDashboardTimeRow[] = [
      {
        timeLabel: '08:00',
        startMinutes: 480,
        endMinutes: 510,
        layers: [
          {
            ...mockRows[0].layers[0],
            status: 'AVAILABLE',
            statusLabel: 'Disponible',
            procedureTitle: undefined,
            patientName: undefined,
          },
        ],
      },
    ];

    const timedFixture = TestBed.createComponent(DailyCascadeCalendarComponent);
    timedFixture.componentRef.setInput('selectedDate', new Date('2026-11-06T12:00:00-05:00'));
    timedFixture.componentRef.setInput('overlayDoctors', [mockDoctor]);
    timedFixture.componentRef.setInput('timeGridRows', availableRows);
    timedFixture.detectChanges();

    const slotEl = timedFixture.nativeElement.querySelector('.slot-layer') as HTMLElement;
    expect(slotEl.classList.contains('slot-layer--past')).toBe(false);
    expect(slotEl.classList.contains('slot-layer--disabled')).toBe(false);
  });

  it('debe deshabilitar slots AVAILABLE que ya finalizaron hoy o en días pasados y bloquear slotClick, pero permitir ver detalle en citas CONFIRMED/SCHEDULED', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-06T08:30:00-05:00'));

    const mixedRows: IDashboardTimeRow[] = [
      {
        timeLabel: '08:00',
        startMinutes: 480,
        endMinutes: 510,
        layers: [
          {
            ...mockRows[0].layers[0],
            status: 'AVAILABLE',
            statusLabel: 'Disponible',
            procedureTitle: undefined,
            patientName: undefined,
          },
          {
            ...mockRows[0].layers[0],
            doctorCedula: '1002',
            status: 'CONFIRMED',
            statusLabel: 'Confirmada',
          },
        ],
      },
    ];

    const timedFixture = TestBed.createComponent(DailyCascadeCalendarComponent);
    const timedComp = timedFixture.componentInstance;
    timedFixture.componentRef.setInput('selectedDate', new Date('2026-11-06T12:00:00-05:00'));
    timedFixture.componentRef.setInput('overlayDoctors', [mockDoctor]);
    timedFixture.componentRef.setInput('timeGridRows', mixedRows);
    timedFixture.detectChanges();

    const slots = timedFixture.nativeElement.querySelectorAll('.slot-layer') as NodeListOf<HTMLElement>;
    expect(slots[0].classList.contains('slot-layer--past')).toBe(true);
    expect(slots[0].classList.contains('slot-layer--disabled')).toBe(true);
    expect(slots[0].getAttribute('aria-disabled')).toBe('true');

    expect(slots[1].classList.contains('slot-layer--past')).toBe(true);
    expect(slots[1].classList.contains('slot-layer--disabled')).toBe(false);

    const emitted: unknown[] = [];
    timedComp.slotClick.subscribe((cell) => emitted.push(cell));

    timedComp.onSlotSelect(mixedRows[0].layers[0], mixedRows[0]);
    expect(emitted.length).toBe(0);

    timedComp.onSlotSelect(mixedRows[0].layers[1], mixedRows[0]);
    expect(emitted.length).toBe(1);
  });
});

