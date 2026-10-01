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
  IAvailableWeekRangesResponse,
} from '@nx-boilerplate/api-interfaces';
import {
  buildCalendarWeek,
  getColombiaWeekRange,
} from '@nx-boilerplate/shared/utils';

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

  /**
   * Estado reactivo interno para el profesional médico activo en el calendario
   */
  readonly #activeProfessional = signal<IProfessionalSummary | null>(null);
  public readonly activeProfessional = this.#activeProfessional.asReadonly();

  /**
   * Catálogo de profesionales médicos disponibles para selección
   */
  readonly #availableProfessionals = signal<IProfessionalSummary[]>([]);
  public readonly availableProfessionals = this.#availableProfessionals.asReadonly();

  constructor() {
    this.loadProcedures();
    this.fetchActiveProfessionals();
  }

  /**
   * Consulta el catálogo de especialistas activos desde el API Gateway (GET /api/doctors)
   * y establece el primer especialista como seleccionado por defecto si aún no hay ninguno activo.
   */
  fetchActiveProfessionals(): void {
    this.apiClient
      .get<IProfessionalSummary[]>('/api/doctors')
      .pipe(
        map((response) => response.data ?? []),
        catchError((error) => {
          console.error('Error al cargar profesionales activos desde API Gateway:', error);
          return of([]);
        })
      )
      .subscribe((doctors) => {
        this.#availableProfessionals.set(doctors);
        if (doctors.length > 0 && !this.#activeProfessional()) {
          this.#activeProfessional.set(doctors[0]);
        }
      });
  }

  /**
   * Selecciona el profesional médico activo en el calendario
   */
  selectProfessional(professional: IProfessionalSummary): void {
    this.#activeProfessional.set(professional);
  }

  /**
   * Selecciona el profesional médico activo a partir de su número de cédula
   */
  selectProfessionalByCedula(cedula: string): void {
    const doctor = this.#availableProfessionals().find((p) => p.cedula === cedula);
    if (doctor) {
      this.#activeProfessional.set(doctor);
    }
  }

  /**
   * Consulta los rangos de semanas futuras con disponibilidad para un profesional médico
   */
  getAvailableWeekRanges(professionalCedula: string): Observable<IAvailableWeekRangesResponse> {
    return this.apiClient
      .get<IAvailableWeekRangesResponse>(
        `/api/appointments/available-weeks?professionalCedula=${professionalCedula}`
      )
      .pipe(
        map((response) => response.data ?? { professionalCedula, ranges: [] }),
        catchError((error) => {
          console.warn(`Error al consultar rangos disponibles para cédula ${professionalCedula}:`, error);
          return of({
            professionalCedula,
            ranges: [
              { weekStart: '2026-09-28', weekEnd: '2026-10-04', hasAvailableSlots: true, totalAvailableSlots: 15 },
              { weekStart: '2026-10-05', weekEnd: '2026-10-11', hasAvailableSlots: true, totalAvailableSlots: 12 },
              { weekStart: '2026-10-12', weekEnd: '2026-10-18', hasAvailableSlots: false, totalAvailableSlots: 0 },
              { weekStart: '2026-10-19', weekEnd: '2026-10-25', hasAvailableSlots: true, totalAvailableSlots: 8 },
            ],
          });
        })
      );
  }

  /**
   * Carga declarativa y síncrona de la disponibilidad semanal usando utilidades compartidas
   * con cálculo dinámico en la zona horaria de Colombia.
   */
  loadMockWeekAvailability(offsetWeeks = 0): void {
    const week = getColombiaWeekRange(offsetWeeks);
    const days = buildCalendarWeek(week.days);
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
