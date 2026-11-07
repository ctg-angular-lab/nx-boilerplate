import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ApiClientService } from '@nx-boilerplate/data-access';
import { RemoteEntryComponent } from './remote-entry.component';
import { DashboardStateService } from '../services/dashboard-state.service';
import { IActiveProfessional, IDayAvailability } from '@nx-boilerplate/api-interfaces';

describe('RemoteEntryComponent', () => {
  let component: RemoteEntryComponent;
  let fixture: ComponentFixture<RemoteEntryComponent>;
  let apiClientMock: {
    get: ReturnType<typeof vi.fn>;
  };
  let routerMock: {
    navigate: ReturnType<typeof vi.fn>;
  };

  const mockDoctors: IActiveProfessional[] = [
    {
      cedula: '1001',
      nombres: 'Alejandro',
      apellidos: 'Gómez',
      email: 'alejandro@clinica.com',
      profesion: 'Medicina General',
      isActive: true,
      horarioTrabajo: {
        diasLaborales: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
        horaInicio: '08:00',
        horaFin: '17:00',
      },
    },
    {
      cedula: '1002',
      nombres: 'Beatriz',
      apellidos: 'Pinzón',
      email: 'beatriz@clinica.com',
      profesion: 'Dermatología',
      isActive: true,
      horarioTrabajo: {
        diasLaborales: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
        horaInicio: '09:00',
        horaFin: '18:00',
      },
    },
  ];

  const mockAvailability: IDayAvailability[] = [
    {
      date: '2026-11-06',
      dayName: 'Viernes',
      isCalendarSynced: true,
      isWorkingDay: true,
      slots: [
        {
          startTime: '09:00',
          endTime: '09:45',
          display: '09:00 - 09:45',
          colorId: null,
          isBookable: false,
          status: 'CONFIRMED',
          title: 'Consulta General',
        },
      ],
    },
    {
      date: '2026-11-20',
      dayName: 'Viernes',
      isCalendarSynced: true,
      isWorkingDay: true,
      slots: [
        {
          startTime: '10:00',
          endTime: '10:45',
          display: '10:00 - 10:45',
          colorId: null,
          isBookable: true,
          status: 'AVAILABLE',
          title: 'Espacio Libre',
        },
      ],
    },
  ];

  beforeEach(async () => {
    apiClientMock = {
      get: vi.fn().mockImplementation((url: string, options?: { params?: { doctorCedula?: string } }) => {
        if (url === '/api/doctors') return of({ data: mockDoctors });
        if (url === '/api/appointments/available-dates') {
          if (options?.params?.doctorCedula === '1002') {
            return of({ data: [] });
          }
          return of({ data: mockAvailability });
        }
        return of({ data: [] });
      }),
    };

    routerMock = {
      navigate: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [RemoteEntryComponent],
      providers: [
        DashboardStateService,
        { provide: ApiClientService, useValue: apiClientMock },
        { provide: Router, useValue: routerMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RemoteEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse, disparar loadDoctors y renderizar el header, los 2 KPIs y el mini-calendario', () => {
    expect(component).toBeTruthy();
    expect(apiClientMock.get).toHaveBeenCalledWith('/api/doctors');

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Dr(a). Alejandro Gómez');
    expect(compiled.textContent).toContain(component.state.monthlyKpis().confirmedTitle);
    expect(compiled.textContent).toContain(component.state.monthlyKpis().scheduledTitle);
    expect(compiled.textContent).toContain('Proximo espacio disponible');
    expect(compiled.textContent).toContain('Otros calendarios');
    expect(compiled.textContent).toContain('Calendario — ');
    expect(component.calendarDays().length).toBe(42);
  });

  it('debe permitir seleccionar un profesional diferente al hacer clic en un pill', () => {
    const state = component.state;
    expect(state.activeDoctor()?.cedula).toBe('1001');

    component.onDoctorSelect('1002');
    fixture.detectChanges();

    expect(state.activeDoctor()?.cedula).toBe('1002');
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Dr(a). Beatriz Pinzón');
  });

  it('debe delegar la navegación de días, meses y retorno a hoy al state service', () => {
    const state = component.state;
    const initialDay = state.selectedDate().getDate();

    component.onNavigateDay(1);
    expect(state.selectedDate().getDate()).toBe(initialDay + 1);

    const prevMonthLabel = component.calendarMonthLabel();
    component.onChangeCalendarMonth(1);
    expect(component.calendarMonthLabel()).not.toBe(prevMonthLabel);

    component.onGoToToday();
    const today = new Date();
    expect(state.selectedDate().toDateString()).toBe(today.toDateString());
  });

  it('debe navegar a /agendador-citas al invocar onScheduleNextAvailableSlot', () => {
    component.onScheduleNextAvailableSlot();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/agendador-citas']);
  });

  it('debe computar correctamente nextAvailableSubtitle y su estado interactivo al haber cupos disponibles', () => {
    // Inicialmente con mockAvailability, hay cupo el 20/11/2026
    expect(component.state.monthlyKpis().nextAvailableDate).toBe('20/11/2026');
    expect(component.nextAvailableSubtitle()).toBe('Agendar en este espacio');
    expect(component.isNextAvailableClickable()).toBe(true);

    fixture.detectChanges();
    const subtitleBtn = fixture.nativeElement.querySelector('.metric-subtitle-btn');
    expect(subtitleBtn).toBeTruthy();
    expect(subtitleBtn.textContent).toContain('Agendar en este espacio');

    subtitleBtn.click();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/agendador-citas']);
  });

  it('debe mantener nextAvailableSubtitle vacío y ocultar el botón cuando no hay cupos disponibles', () => {
    // Al seleccionar el doctor 1002 que no tiene cupos disponibles
    component.onDoctorSelect('1002');
    fixture.detectChanges();

    expect(component.state.monthlyKpis().nextAvailableDate).toBe('Sin Cupos este mes');
    expect(component.nextAvailableSubtitle()).toBe('');
    expect(component.isNextAvailableClickable()).toBe(false);

    const subtitleBtn = fixture.nativeElement.querySelector('.metric-subtitle-btn');
    expect(subtitleBtn).toBeNull();
  });
});
