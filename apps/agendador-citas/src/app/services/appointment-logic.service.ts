import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { ApiClientService } from '@nx-boilerplate/data-access';
import {
  IApiResponse,
  ICreateAppointmentRequest,
  IDayAvailability,
  IPatientHistory,
  IProcedure,
  IProfessionalSummary,
  CalendarDay,
} from '@nx-boilerplate/api-interfaces';
import { generateDaySlots } from '@nx-boilerplate/shared/utils';

@Injectable({
  providedIn: 'root',
})
export class AppointmentLogicService {
  private readonly apiClient = inject(ApiClientService);

  /**
   * Estado reactivo interno para el historial del paciente consultado
   */
  private readonly _patientHistory = signal<IPatientHistory | null>(null);

  /**
   * Signal público de solo lectura para consumo directo en templates y componentes.
   * Patrón Signal Nativo para Servicios:
   * - Elimina la necesidad de toSignal() en el servicio root, evitando NG0203.
   * - Desacopla el ciclo de vida de la suscripción del contexto de inyección.
   */
  readonly patientHistory = this._patientHistory.asReadonly();

  /**
   * Catálogo de procedimientos médicos cargados desde MongoDB Atlas
   */
  private readonly _procedures = signal<IProcedure[]>([]);
  readonly procedures = this._procedures.asReadonly();

  /**
   * Estado reactivo para la disponibilidad semanal del calendario (Mock / API)
   * Patrón Signal Nativo con Visibilidad Encapsulada (#weekDays privado + weekDays público readonly)
   */
  readonly #weekDays = signal<CalendarDay[]>([]);
  public readonly weekDays = this.#weekDays.asReadonly();

  constructor() {
    this.loadProcedures();
  }

  /**
   * Carga declarativa y síncrona de la disponibilidad semanal usando utilidades compartidas
   */
  loadMockWeekAvailability(): void {
    const days: CalendarDay[] = [
      {
        date: new Date(2026, 7, 24),
        label: 'Lunes',
        subLabel: '24 ago',
        isToday: false,
        isAvailable: true,
        slots: generateDaySlots('lun', [1, 3, 7]),
      },
      {
        date: new Date(2026, 7, 25),
        label: 'Martes',
        subLabel: '25 ago',
        isToday: false,
        isAvailable: true,
        slots: generateDaySlots('mar', [2, 5, 8]),
      },
      {
        date: new Date(2026, 7, 26),
        label: 'Miércoles',
        subLabel: '26 ago',
        isToday: true,
        isAvailable: true,
        slots: generateDaySlots('mie', [0, 4, 9, 12]),
      },
      {
        date: new Date(2026, 7, 27),
        label: 'Jueves',
        subLabel: '27 ago',
        isToday: false,
        isAvailable: true,
        slots: generateDaySlots('jue', [3, 6, 11]),
      },
      {
        date: new Date(2026, 7, 28),
        label: 'Viernes',
        subLabel: '28 ago',
        isToday: false,
        isAvailable: true,
        slots: generateDaySlots('vie', [1, 4, 7, 10]),
      },
      {
        date: new Date(2026, 7, 29),
        label: 'Sábado',
        subLabel: '29 ago',
        isToday: false,
        isAvailable: true,
        slots: generateDaySlots('sab', [2, 5]),
      },
      {
        date: new Date(2026, 7, 30),
        label: 'Domingo',
        subLabel: '30 ago',
        isToday: false,
        isAvailable: false,
        slots: [],
      },
    ];

    this.#weekDays.set(days);
  }

  /**
   * Carga la lista completa de procedimientos médicos desde el API Gateway
   */
  loadProcedures(): void {
    this.apiClient
      .get<IProcedure[]>('/api/procedures')
      .pipe(
        map((response) => response.data ?? []),
        catchError((error) => {
          console.error('Error al cargar procedimientos médicos desde Atlas:', error);
          return of([]);
        })
      )
      .subscribe((procedures) => {
        this._procedures.set(procedures);
      });
  }

  /**
   * Dispara la verificación de identidad del paciente contra el API Gateway
   * y actualiza el Signal de forma reactiva y síncrona para la vista.
   */
  verifyPatient(cedula: string): void {
    const cleanCedula = cedula?.trim();
    if (!cleanCedula) {
      this._patientHistory.set(null);
      return;
    }

    this.apiClient
      .get<IPatientHistory>(`/api/patients/${cleanCedula}`)
      .pipe(
        map((response) => response.data),
        catchError((error) => {
          console.warn(`Paciente con cédula ${cleanCedula} no encontrado o error en gateway:`, error);
          return of(null);
        })
      )
      .subscribe((patient) => {
        this._patientHistory.set(patient);
      });
  }

  /**
   * Consulta los médicos profesionales asignados a un procedimiento determinado
   */
  getProcedureDoctors(procedureId: string): Observable<IProfessionalSummary[]> {
    return this.apiClient
      .get<IProfessionalSummary[]>(`/api/procedures/${procedureId}/doctors`)
      .pipe(
        map((response) => response.data ?? []),
        catchError((error) => {
          console.error(`Error al consultar médicos para el procedimiento ${procedureId}:`, error);
          return of([]);
        })
      );
  }

  /**
   * Consulta las fechas y turnos disponibles para un procedimiento médico determinado
   */
  getAvailableDates(procedureId: string): Observable<IDayAvailability[]> {
    return this.apiClient
      .get<IDayAvailability[]>(`/api/appointments/available-dates?procedureId=${procedureId}`)
      .pipe(map((response) => response.data ?? []));
  }

  /**
   * Orquesta la mutación para agendar una nueva cita médica.
   */
  createAppointment(payload: ICreateAppointmentRequest): Observable<IApiResponse<unknown>> {
    return this.apiClient.post<unknown>('/api/appointments', payload);
  }
}
