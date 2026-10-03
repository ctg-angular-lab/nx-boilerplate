import { Injectable, inject, signal, effect } from '@angular/core';
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
  TimeSlot,
  SlotStatus,
} from '@nx-boilerplate/api-interfaces';
import {
  getColombiaToday,
  normalizeDate,
  formatDateYMD,
  getWeekSchedule,
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
   */
  readonly patientHistory = this._patientHistory.asReadonly();

  /**
   * Catálogo de procedimientos médicos cargados desde MongoDB Atlas
   */
  private readonly _procedures = signal<IProcedure[]>([]);
  readonly procedures = this._procedures.asReadonly();

  /**
   * Offset de semana respecto a la semana actual de Colombia (0 = actual, 1 = próxima, ...)
   * SSOT: Gestionado centralizadamente en el servicio.
   */
  readonly #currentWeekOffset = signal<number>(0);
  public readonly currentWeekOffset = this.#currentWeekOffset.asReadonly();

  /**
   * Estado de carga de la disponibilidad semanal del calendario
   */
  readonly #isLoadingCalendar = signal<boolean>(false);
  public readonly isLoadingCalendar = this.#isLoadingCalendar.asReadonly();

  /**
   * Estado reactivo para la disponibilidad semanal del calendario (Sincronizado con API)
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

    // Sincroniza automáticamente la agenda semanal cada vez que cambia el profesional o la semana
    effect(() => {
      const doctor = this.#activeProfessional();
      const offset = this.#currentWeekOffset();
      if (doctor?.email) {
        this.#fetchCalendarWeek(doctor.email, offset);
      }
    });
  }

  /**
   * Avanza una semana en el calendario
   */
  nextWeek(): void {
    this.#currentWeekOffset.update((offset) => offset + 1);
  }

  /**
   * Retrocede una semana (impide ir antes de la semana actual)
   */
  previousWeek(): void {
    if (this.#currentWeekOffset() > 0) {
      this.#currentWeekOffset.update((offset) => offset - 1);
    }
  }

  /**
   * Restablece el calendario a la semana actual (Hoy)
   */
  goToToday(): void {
    this.#currentWeekOffset.set(0);
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
   * Selecciona el profesional médico activo en el calendario y restablece el offset a 0
   */
  selectProfessional(professional: IProfessionalSummary): void {
    this.#activeProfessional.set(professional);
    this.#currentWeekOffset.set(0);
  }

  /**
   * Selecciona el profesional médico activo a partir de su número de cédula y restablece el offset a 0
   */
  selectProfessionalByCedula(cedula: string): void {
    const doctor = this.#availableProfessionals().find((p) => p.cedula === cedula);
    if (doctor) {
      this.#activeProfessional.set(doctor);
      this.#currentWeekOffset.set(0);
    }
  }

  /**
   * Genera la grilla completa de slots de un día laboral (07:00-19:00, 45 min, excluyendo almuerzo 12:00-13:00)
   * Retorna el array de display strings en formato "HH:MM - HH:MM" (hora Colombia).
   */
  #generateDailySlotGrid(): string[] {
    const displays: string[] = [];
    const startMin = 7 * 60;          // 07:00 COL
    const endMin = 19 * 60;           // 19:00 COL
    const lunchStart = 12 * 60;       // 12:00 COL
    const lunchEnd = 13 * 60;         // 13:00 COL
    const interval = 45;

    for (let current = startMin; current + interval <= endMin; current += interval) {
      const slotEnd = current + interval;
      // Excluir si solapa con almuerzo
      if (current < lunchEnd && slotEnd > lunchStart) continue;
      const fmt = (m: number) =>
        `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
      displays.push(`${fmt(current)} - ${fmt(slotEnd)}`);
    }
    return displays;
  }

  /**
   * Fusiona slots 'reservado' consecutivos en un único bloque con rango de tiempo combinado.
   * Ej: [13:00-13:45, 13:45-14:30, 14:30-15:15] (reservado) → [13:00-15:15] (reservado)
   */
  #mergeConsecutiveBusySlots(slots: TimeSlot[]): TimeSlot[] {
    const merged: TimeSlot[] = [];
    let i = 0;

    while (i < slots.length) {
      if (slots[i].status !== 'reservado') {
        merged.push(slots[i]);
        i++;
        continue;
      }

      // Encontrar el fin del bloque consecutivo de reservados
      let j = i;
      while (j < slots.length && slots[j].status === 'reservado') {
        j++;
      }

      // Extraer hora de inicio del primer slot y hora de fin del último
      const rangeStart = slots[i].time.split(' - ')[0].trim();   // "13:00"
      const rangeEnd   = slots[j - 1].time.split(' - ')[1].trim(); // "15:15"

      merged.push({
        id: slots[i].id,
        time: `${rangeStart} - ${rangeEnd}`,
        status: 'reservado',
        mergedCount: j - i,
      });

      i = j;
    }

    return merged;
  }

  /**
   * Consulta la disponibilidad semanal de un médico en el backend y mapea a CalendarDay[].
   * Genera la grilla completa de slots por día, marca como 'reservado' los bloqueados
   * y fusiona franjas ocupadas consecutivas en un único bloque visual.
   */
  #fetchCalendarWeek(doctorEmail: string, offset: number): void {
    this.#isLoadingCalendar.set(true);
    const { days, window } = getWeekSchedule(offset);
    const fullDailyGrid = this.#generateDailySlotGrid();

    const url = `/api/appointments/available-dates?doctorEmail=${encodeURIComponent(
      doctorEmail
    )}&startDate=${window.startDate}&endDate=${window.endDate}`;

    this.apiClient
      .get<IDayAvailability[]>(url)
      .pipe(
        map((response) => response.data ?? []),
        catchError((error) => {
          console.warn(`Error al consultar disponibilidad semanal para ${doctorEmail}:`, error);
          return of<IDayAvailability[]>([]);
        })
      )
      .subscribe((backendDays) => {
        const today = getColombiaToday();
        const todayTime = today.getTime();
        const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const monthShort = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

        const calendarDays: CalendarDay[] = days.map((dayDate) => {
          const dateStr = formatDateYMD(dayDate);
          const dayTime = normalizeDate(dayDate).getTime();
          const isToday = dayTime === todayTime;
          const isPast = dayTime < todayTime;
          const dayOfWeek = dayDate.getDay();
          const isSunday = dayOfWeek === 0;
          const label = dayNames[dayOfWeek];
          const subLabel = `${dayDate.getDate()} ${monthShort[dayDate.getMonth()]}`;

          // Domingo o día pasado: columna no disponible sin slots
          if (isSunday || isPast) {
            return { date: dayDate, label, subLabel, slots: [], isToday, isPast, isAvailable: false };
          }

          const backendDay = backendDays.find((b) => b.date === dateStr);

          // Calendario no sincronizado: mostrar placeholder especial por columna
          if (backendDay && backendDay.isCalendarSynced === false) {
            return {
              date: dayDate, label, subLabel, slots: [], isToday, isPast,
              isAvailable: false,
              isCalendarSynced: false,
              doctorEmail,
            };
          }

          // Set de displays disponibles para búsqueda O(1)
          const availableDisplays = new Set(
            (backendDay?.slots ?? []).map((s) => s.display)
          );

          // Grilla completa con estado por slot
          const rawSlots: TimeSlot[] = fullDailyGrid.map((display, index) => ({
            id: `${dateStr}-slot-${index}`,
            time: display,
            status: availableDisplays.has(display) ? ('disponible' as SlotStatus) : ('reservado' as SlotStatus),
          }));

          // Fusionar franjas ocupadas consecutivas en un único bloque
          const slots = this.#mergeConsecutiveBusySlots(rawSlots);

          const hasAnyAvailable = slots.some((s) => s.status === 'disponible');

          return {
            date: dayDate,
            label,
            subLabel,
            slots,
            isToday,
            isPast,
            isAvailable: hasAnyAvailable,
            isCalendarSynced: true,
          };
        });

        this.#weekDays.set(calendarDays);
        this.#isLoadingCalendar.set(false);
      });
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
