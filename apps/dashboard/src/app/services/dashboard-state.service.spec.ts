import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ApiClientService } from '@nx-boilerplate/data-access';
import { DashboardStateService } from './dashboard-state.service';
import { IActiveProfessional, IDayAvailability } from '@nx-boilerplate/api-interfaces';

describe('DashboardStateService', () => {
  let service: DashboardStateService;
  let apiClientMock: {
    get: ReturnType<typeof vi.fn>;
  };

  const defaultSchedule = {
    diasLaborales: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
    horaInicio: '08:00',
    horaFin: '17:00',
  };

  const mockDoctors: IActiveProfessional[] = [
    {
      cedula: '1001',
      nombres: 'Alejandro',
      apellidos: 'Gómez',
      email: 'alejandro@clinica.com',
      profesion: 'Medicina General',
      isActive: true,
      horarioTrabajo: defaultSchedule,
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
    {
      cedula: '1003',
      nombres: 'Carlos',
      apellidos: 'Sarmiento',
      email: 'carlos@clinica.com',
      profesion: 'Ortopedia',
      isActive: true,
      horarioTrabajo: defaultSchedule,
    },
    {
      cedula: '1004',
      nombres: 'Diana',
      apellidos: 'Morales',
      email: 'diana@clinica.com',
      profesion: 'Pediatría',
      isActive: true,
      horarioTrabajo: defaultSchedule,
    },
    {
      cedula: '1005',
      nombres: 'Ernesto',
      apellidos: 'Pérez',
      email: 'ernesto@clinica.com',
      profesion: 'Cardiología',
      isActive: true,
      horarioTrabajo: defaultSchedule,
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
        {
          startTime: '10:00',
          endTime: '10:45',
          display: '10:00 - 10:45',
          colorId: null,
          isBookable: false,
          status: 'TENTATIVE',
          title: 'Revisión',
        },
      ],
    },
  ];

  beforeEach(() => {
    apiClientMock = {
      get: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        DashboardStateService,
        { provide: ApiClientService, useValue: apiClientMock },
      ],
    });

    service = TestBed.inject(DashboardStateService);
  });

  it('debe crearse e inicializarse con valores por defecto', () => {
    expect(service).toBeTruthy();
    expect(service.doctors()).toEqual([]);
    expect(service.comparedDoctorCedulas()).toEqual([]);
    expect(service.selectedDoctorCedula()).toBeNull();
    expect(service.activeDoctor()).toBeNull();
  });

  describe('loadDoctors', () => {
    it('debe cargar los médicos, seleccionar el primero y pedir la disponibilidad de la semana', () => {
      apiClientMock.get.mockImplementation((url: string) => {
        if (url === '/doctors') return of({ data: mockDoctors });
        if (url === '/appointments/available-dates') return of({ data: mockAvailability });
        return of({ data: [] });
      });

      service.loadDoctors();

      expect(service.doctors().length).toBe(5);
      expect(service.activeDoctor()?.cedula).toBe('1001');
      expect(service.activeDoctor()?.fullName).toBe('Dr(a). Alejandro Gómez');
      expect(service.activeDoctor()?.initials).toBe('AG');
      expect(service.otherDoctors().length).toBe(4);
    });

    it('debe usar fallback resiliente si el endpoint /doctors falla', () => {
      apiClientMock.get.mockReturnValue(throwError(() => new Error('Offline')));

      service.loadDoctors();

      expect(service.doctors().length).toBeGreaterThan(0);
      expect(service.activeDoctor()).toBeTruthy();
    });
  });

  describe('selectDoctor & comparedDoctorCedulas', () => {
    beforeEach(() => {
      apiClientMock.get.mockReturnValue(of({ data: mockDoctors }));
      service.loadDoctors();
    });

    it('debe permitir cambiar de médico principal', () => {
      service.selectDoctor('1002');
      expect(service.activeDoctor()?.cedula).toBe('1002');
      expect(service.otherDoctors().some((d) => d.cedula === '1002')).toBe(false);
    });

    it('debe remover el médico de comparedDoctorCedulas si es seleccionado como principal', () => {
      service.toggleComparedDoctor('1002');
      expect(service.comparedDoctorCedulas()).toContain('1002');

      service.selectDoctor('1002');
      expect(service.activeDoctor()?.cedula).toBe('1002');
      expect(service.comparedDoctorCedulas()).not.toContain('1002');
    });

    it('debe agregar y remover médicos para comparar', () => {
      service.toggleComparedDoctor('1002');
      expect(service.comparedDoctorCedulas()).toEqual(['1002']);

      service.toggleComparedDoctor('1002');
      expect(service.comparedDoctorCedulas()).toEqual([]);
    });

    it('no debe permitir comparar al médico activo consigo mismo', () => {
      service.toggleComparedDoctor('1001'); // 1001 es el activo
      expect(service.comparedDoctorCedulas()).toEqual([]);
    });

    it('debe respetar el límite de 3 médicos adicionales en comparedDoctorCedulas (4 capas totales)', () => {
      service.toggleComparedDoctor('1002');
      service.toggleComparedDoctor('1003');
      service.toggleComparedDoctor('1004');
      expect(service.comparedDoctorCedulas().length).toBe(3);

      // Agregar un 4to desplaza al más antiguo (FIFO)
      service.toggleComparedDoctor('1005');
      expect(service.comparedDoctorCedulas().length).toBe(3);
      expect(service.comparedDoctorCedulas()).toEqual(['1003', '1004', '1005']);
      expect(service.activeOverlayDoctors().length).toBe(4);
    });

    it('debe limpiar los médicos comparados con clearComparedDoctors', () => {
      service.toggleComparedDoctor('1002');
      service.toggleComparedDoctor('1003');
      expect(service.comparedDoctorCedulas().length).toBe(2);

      service.clearComparedDoctors();
      expect(service.comparedDoctorCedulas()).toEqual([]);
    });
  });

  describe('Navegación de fechas', () => {
    it('debe permitir navegar a días relativos', () => {
      const initialDate = service.selectedDate();
      service.navigateRelativeDays(1);

      const nextDay = new Date(initialDate);
      nextDay.setDate(nextDay.getDate() + 1);

      expect(service.selectedDate().getDate()).toBe(nextDay.getDate());
    });

    it('debe permitir volver a hoy con selectToday', () => {
      service.navigateRelativeDays(10);
      service.selectToday();

      const today = new Date();
      expect(service.selectedDate().toDateString()).toBe(today.toDateString());
    });
  });
});
