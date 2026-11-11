import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ApiClientService } from '@nx-boilerplate/data-access';
import {
  AgendarModalComponent,
  AgendarModalResult,
  ConfirmationModalComponent,
} from '@nx-boilerplate/layouts';
import { RemoteEntryComponent } from './remote-entry.component';
import { DashboardStateService } from '../services/dashboard-state.service';
import { IActiveProfessional, IDayAvailability } from '@nx-boilerplate/api-interfaces';

describe('RemoteEntryComponent', () => {
  let component: RemoteEntryComponent;
  let fixture: ComponentFixture<RemoteEntryComponent>;
  let apiClientMock: {
    get: ReturnType<typeof vi.fn>;
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

    await TestBed.configureTestingModule({
      imports: [RemoteEntryComponent],
      providers: [
        DashboardStateService,
        { provide: ApiClientService, useValue: apiClientMock },
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
    expect(compiled.textContent).toContain(component.state.monthlyKpis().reportTitle);
    expect(compiled.textContent).toContain('Citas Confirmadas');
    expect(compiled.textContent).toContain('Citas Agendadas');
    expect(compiled.textContent).toContain('Citas Canceladas');
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

  it('debe renderizar hasta 3 espacios disponibles en .metric-value-item sin subtitulo en la segunda tarjeta KPI', () => {
    expect(component.state.monthlyKpis().nextAvailableDates).toEqual(['20/11/2026 - 10:00 am']);

    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const cards = compiled.querySelectorAll('lib-metric-card');
    expect(cards.length).toBe(2);
    const secondCard = cards[1];
    expect(secondCard).toBeTruthy();

    const valueItems = secondCard.querySelectorAll('.metric-value-item');
    expect(valueItems.length).toBe(1);
    expect(valueItems[0]?.textContent?.trim()).toBe('20/11/2026 - 10:00 am');

    const subtitleEl = secondCard.querySelector('.metric-subtitle');
    expect(subtitleEl).toBeNull();
  });

  it('debe navegar a /agendador-citas al hacer clic en un .metric-value-item disponible del card "Proximo espacio disponible"', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const secondCard = compiled.querySelectorAll('lib-metric-card')[1];
    const firstItem = secondCard?.querySelector('.metric-value-item') as HTMLElement;
    expect(firstItem).toBeTruthy();

    firstItem.click();
    expect(navigateSpy).toHaveBeenCalledWith(['/agendador-citas']);

    navigateSpy.mockClear();
    component.onAvailableSlotItemClick('Sin Cupos este mes');
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('debe mostrar "Sin Cupos este mes" sin subtitulo cuando no hay cupos disponibles', () => {
    component.onDoctorSelect('1002');
    fixture.detectChanges();

    expect(component.state.monthlyKpis().nextAvailableDates).toEqual(['Sin Cupos este mes']);

    const compiled = fixture.nativeElement as HTMLElement;
    const cards = compiled.querySelectorAll('lib-metric-card');
    const secondCard = cards[1];
    expect(secondCard).toBeTruthy();

    const valueItems = secondCard.querySelectorAll('.metric-value-item');
    expect(valueItems.length).toBe(1);
    expect(valueItems[0]?.textContent?.trim()).toBe('Sin Cupos este mes');

    const subtitleEl = secondCard.querySelector('.metric-subtitle');
    expect(subtitleEl).toBeNull();
  });

  it('debe invocar resetToDefaults en el state al destruirse el componente', () => {
    const resetSpy = vi.spyOn(component.state, 'resetToDefaults');
    component.ngOnDestroy();
    expect(resetSpy).toHaveBeenCalledTimes(1);
  });

  it('debe abrir ConfirmationModalComponent al hacer clic en un slot disponible y navegar a /agendador-citas si se confirma', () => {
    const dialog = fixture.debugElement.injector.get(MatDialog);
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const openSpy = vi.spyOn(dialog, 'open').mockReturnValue({
      afterClosed: () => of(true),
    } as MatDialogRef<ConfirmationModalComponent, boolean>);

    const sampleCell = component.state.timeGridRows()[0]?.layers[0];
    expect(sampleCell).toBeDefined();

    component.onSlotClick({ ...sampleCell, status: 'AVAILABLE' });

    expect(openSpy).toHaveBeenCalledWith(
      ConfirmationModalComponent,
      expect.objectContaining({
        data: expect.objectContaining({
          text: '¿Quieres agendar una nueva cita en este espacio?',
          actions: [
            { label: 'Cancelar', color: 'default', value: false },
            { label: 'Confirmar', color: 'primary', value: true },
          ],
        }),
      })
    );
    expect(navigateSpy).toHaveBeenCalledWith(['/agendador-citas']);
  });

  it('debe abrir AgendarModalComponent con los datos de la cita al hacer clic en un slot SCHEDULED y redirigir al tab 3 de agendador-citas al confirmar cita', () => {
    const dialog = fixture.debugElement.injector.get(MatDialog);
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const openSpy = vi.spyOn(dialog, 'open').mockReturnValue({
      afterClosed: () => of({ agendar: false, goToConfirmationTab: true }),
    } as MatDialogRef<AgendarModalComponent, AgendarModalResult>);

    const sampleCell = component.state.timeGridRows()[0]?.layers[0];
    expect(sampleCell).toBeDefined();

    component.onSlotClick({
      ...sampleCell,
      status: 'SCHEDULED',
      procedureTitle: 'Toxina Botulínica',
      patientName: 'Elena Castro',
      timeRangeLabel: '10:30 - 11:15',
      patient: {
        nombre: 'Elena',
        apellidos: 'Castro',
        cedula: '778899',
        correo: 'elena@mail.com',
        celular: '3004445566',
      },
    });

    expect(openSpy).toHaveBeenCalledWith(
      AgendarModalComponent,
      expect.objectContaining({
        data: expect.objectContaining({
          title: 'Toxina Botulínica',
          professional: 'Dr(a). Alejandro Gómez',
          isTentativeView: true,
          slotStatus: 'TENTATIVE',
        }),
      })
    );

    expect(navigateSpy).toHaveBeenCalledWith(
      ['/agendador-citas'],
      expect.objectContaining({
        queryParams: expect.objectContaining({
          tab: 'confirmacion',
        }),
      })
    );
  });
});
