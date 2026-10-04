import {
  Injectable,
  inject,
  signal,
  computed,
  DestroyRef,
} from '@angular/core';
import {
  Observable,
  Subject,
  catchError,
  map,
  of,
  switchMap,
  tap,
} from 'rxjs';
import { ApiClientService } from '@nx-boilerplate/data-access';
import {
  IApiResponse,
  ICreateAppointmentBody,
  IDayAvailability,
  ISlotDisplay,
  IPatientHistory,
  IProcedure,
  IProfessionalSummary,
  CalendarDay,
  TimeSlot,
  SlotStatus,
} from '@nx-boilerplate/api-interfaces';
import {
  getColombiaToday,
  normalizeDate,
  formatDateYMD,
  getWeekSchedule,
} from '@nx-boilerplate/shared/utils';
import {
  AGENDADOR_TABS,
  AgendadorTabId,
  IBookingContext,
} from '../models/booking.models';

interface CalendarFetchRequest {
  doctorEmail: string;
  offset: number;
  autoExpand?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class AppointmentLogicService {
  private readonly apiClient = inject(ApiClientService);
  private readonly destroyRef = inject(DestroyRef);

  /**
   * Pipeline reactivo de consultas de calendario para evitar condiciones de carrera (switchMap)
   */
  readonly #calendarFetch$ = new Subject<CalendarFetchRequest>();

  /**
   * Notifica a los componentes cuando una cita ha sido confirmada exitosamente
   */
  readonly #bookingSuccess$ = new Subject<void>();
  public readonly bookingSuccess$ = this.#bookingSuccess$.asObservable();

  /**
   * Identificador de la pestaña activa en el orquestador principal
   * SSOT centralizado en el servicio.
   */
  readonly #activeTab = signal<AgendadorTabId>(AGENDADOR_TABS.FORM);
  public readonly activeTab = this.#activeTab.asReadonly();

  /**
   * Contexto del flujo de agendamiento en curso (paciente, procedimiento y doctor seleccionado en el stepper)
   */
  readonly #bookingContext = signal<IBookingContext | null>(null);
  public readonly bookingContext = this.#bookingContext.asReadonly();

  /**
   * Indica reactivamente si la aplicación se encuentra en modo agendamiento guiado
   */
  public readonly isBookingMode = computed(() => this.#bookingContext() !== null);

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
   * Mensaje de error o advertencia en caso de que no haya disponibilidad cercana
   */
  readonly #calendarError = signal<string | null>(null);
  public readonly calendarError = this.#calendarError.asReadonly();

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

    // Sincronización reactiva con switchMap para cancelar consultas anteriores y evitar condiciones de carrera
    const sub = this.#calendarFetch$
      .pipe(
        switchMap((req) => {
          this.#isLoadingCalendar.set(true);
          this.#calendarError.set(null);

          if (req.autoExpand) {
            return this.#searchAvailableWeek(req.doctorEmail, 0);
          } else {
            return this.#fetchWeekData(req.doctorEmail, req.offset);
          }
        })
      )
      .subscribe({
        next: ({ calendarDays, offset, hasAvailable }) => {
          this.#weekDays.set(calendarDays);
          this.#currentWeekOffset.set(offset);
          this.#isLoadingCalendar.set(false);

          if (!hasAvailable && offset >= 3) {
            this.#calendarError.set(
              'No se encontraron turnos disponibles para las próximas 4 semanas con este profesional.'
            );
          } else {
            this.#calendarError.set(null);
          }
        },
        error: (err) => {
          console.error('Error en pipeline de disponibilidad del calendario:', err);
          this.#isLoadingCalendar.set(false);
          this.#calendarError.set('Ocurrió un error al cargar la disponibilidad.');
        },
      });

    this.destroyRef.onDestroy(() => sub.unsubscribe());
  }

  /**
   * Avanza una semana en el calendario
   */
  nextWeek(): void {
    const doctor = this.#activeProfessional();
    if (!doctor?.email) return;
    const targetOffset = this.#currentWeekOffset() + 1;
    this.#calendarFetch$.next({
      doctorEmail: doctor.email,
      offset: targetOffset,
      autoExpand: false,
    });
  }

  /**
   * Retrocede una semana (impide ir antes de la semana actual)
   */
  previousWeek(): void {
    const doctor = this.#activeProfessional();
    if (!doctor?.email || this.#currentWeekOffset() <= 0) return;
    const targetOffset = this.#currentWeekOffset() - 1;
    this.#calendarFetch$.next({
      doctorEmail: doctor.email,
      offset: targetOffset,
      autoExpand: false,
    });
  }

  /**
   * Restablece el calendario a la semana actual (Hoy)
   */
  goToToday(): void {
    const doctor = this.#activeProfessional();
    if (!doctor?.email) return;
    this.#calendarFetch$.next({
      doctorEmail: doctor.email,
      offset: 0,
      autoExpand: false,
    });
  }

  /**
   * Refresca la semana actual del calendario para el profesional activo
   */
  refreshCalendar(): void {
    const doctor = this.#activeProfessional();
    if (!doctor?.email) return;
    this.#calendarFetch$.next({
      doctorEmail: doctor.email,
      offset: this.#currentWeekOffset(),
      autoExpand: false,
    });
  }

  /**
   * Actualiza la pestaña activa en el flujo
   */
  setActiveTab(id: AgendadorTabId): void {
    this.#activeTab.set(id);
  }

  /**
   * Inicia el flujo de agendamiento guiado desde el Stepper hacia el Calendario:
   * 1. Almacena el contexto completo del paciente y procedimiento.
   * 2. Resuelve y selecciona al doctor contra el catálogo activo.
   * 3. Navega reactivamente a la pestaña del Calendario.
   */
  startBookingFlow(ctx: IBookingContext): void {
    this.#bookingContext.set(ctx);
    const knownDoctor = this.#availableProfessionals().find((p) => p.cedula === ctx.doctor.cedula);
    this.selectProfessional(knownDoctor ?? ctx.doctor);
    this.setActiveTab(AGENDADOR_TABS.CALENDAR);
  }

  /**
   * Limpia el contexto temporal de agendamiento
   */
  clearBookingContext(): void {
    this.#bookingContext.set(null);
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
          this.selectProfessional(doctors[0]);
        }
      });
  }

  /**
   * Selecciona el profesional médico activo en el calendario y busca disponibilidad profunda (autoExpand)
   */
  selectProfessional(professional: IProfessionalSummary): void {
    this.#activeProfessional.set(professional);
    if (professional.email) {
      this.#calendarFetch$.next({
        doctorEmail: professional.email,
        offset: 0,
        autoExpand: true,
      });
    }
  }

  /**
   * Selecciona el profesional médico activo a partir de su número de cédula y busca disponibilidad profunda
   */
  selectProfessionalByCedula(cedula: string): void {
    const doctor = this.#availableProfessionals().find((p) => p.cedula === cedula);
    if (doctor) {
      this.selectProfessional(doctor);
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
   * Mapea la respuesta del backend a la estructura de CalendarDay[], calculando availability y preservando timestamps ISO
   */
  #mapToCalendarDays(
    days: Date[],
    backendDays: IDayAvailability[],
    fullDailyGrid: string[],
    doctorEmail: string
  ): CalendarDay[] {
    const today = getColombiaToday();
    const todayTime = today.getTime();
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const monthShort = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

    return days.map((dayDate) => {
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
          date: dayDate,
          label,
          subLabel,
          slots: [],
          isToday,
          isPast,
          isAvailable: false,
          isCalendarSynced: false,
          doctorEmail,
        };
      }

      // Mapa de displays a slots backend para lookup O(1) y conservación de timestamps ISO
      const availableByDisplay = new Map<string, ISlotDisplay>(
        (backendDay?.slots ?? []).map((s) => [s.display, s])
      );

      // Grilla completa con estado por slot y timestamps ISO preservados
      const rawSlots: TimeSlot[] = fullDailyGrid.map((display, index) => {
        const backendSlot = availableByDisplay.get(display);
        return {
          id: `${dateStr}-slot-${index}`,
          time: display,
          status: backendSlot ? ('disponible' as SlotStatus) : ('reservado' as SlotStatus),
          startTime: backendSlot?.startTime,
          endTime: backendSlot?.endTime,
        };
      });

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
  }

  /**
   * Consulta una única semana al backend y retorna calendarDays, offset y hasAvailable
   */
  #fetchWeekData(
    doctorEmail: string,
    offset: number
  ): Observable<{ calendarDays: CalendarDay[]; offset: number; hasAvailable: boolean }> {
    const { days, window } = getWeekSchedule(offset);
    const fullDailyGrid = this.#generateDailySlotGrid();

    const url = `/api/appointments/available-dates?doctorEmail=${encodeURIComponent(
      doctorEmail
    )}&startDate=${window.startDate}&endDate=${window.endDate}`;

    return this.apiClient.get<IDayAvailability[]>(url).pipe(
      map((response) => response.data ?? []),
      catchError((error) => {
        console.warn(`Error al consultar disponibilidad semanal para ${doctorEmail}:`, error);
        return of<IDayAvailability[]>([]);
      }),
      map((backendDays) => {
        const calendarDays = this.#mapToCalendarDays(days, backendDays, fullDailyGrid, doctorEmail);
        const hasAvailable = calendarDays.some((d) => d.slots.some((s) => s.status === 'disponible'));
        console.log(
          `[Calendario] Offset ${offset}: ${backendDays.length} días recibidos del backend. ¿Tiene turnos libres?: ${hasAvailable}`
        );
        return { calendarDays, offset, hasAvailable };
      })
    );
  }

  /**
   * Búsqueda recursiva con RxJS switchMap de la primera semana disponible (offsets 0 a 3)
   */
  #searchAvailableWeek(
    doctorEmail: string,
    currentOffset = 0
  ): Observable<{ calendarDays: CalendarDay[]; offset: number; hasAvailable: boolean }> {
    return this.#fetchWeekData(doctorEmail, currentOffset).pipe(
      switchMap((res) => {
        if (res.hasAvailable) {
          console.log(`[Calendario] Turnos disponibles encontrados en offset ${currentOffset}. Deteniendo búsqueda.`);
          return of(res);
        }
        if (currentOffset >= 3) {
          console.warn(`[Calendario] Límite de 4 semanas alcanzado sin disponibilidad.`);
          return of(res);
        }
        console.log(`[Calendario] Sin turnos en offset ${currentOffset}. Avanzando a offset ${currentOffset + 1}...`);
        return this.#searchAvailableWeek(doctorEmail, currentOffset + 1);
      })
    );
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
   * Orquesta la creación y confirmación de la cita médica a partir del turno seleccionado
   * y el contexto activo, limpiando el estado y actualizando la navegación al finalizar.
   */
  bookSlot(slot: TimeSlot, notes?: string): Observable<IApiResponse<unknown>> {
    const ctx = this.#bookingContext();
    if (!ctx) {
      throw new Error('No se puede agendar cita sin un contexto de paciente y procedimiento.');
    }
    const doctor = this.#activeProfessional();
    if (!doctor) {
      throw new Error('No se puede agendar cita sin un profesional médico seleccionado.');
    }
    if (!slot.startTime || !slot.endTime) {
      throw new Error(
        `El turno seleccionado (${slot.time}) carece de timestamps ISO (startTime / endTime).`
      );
    }

    const patientFullName = `${ctx.patient.nombre} ${ctx.patient.apellidos}`.trim();

    const body: ICreateAppointmentBody = {
      doctorEmail: doctor.email,
      doctorCedula: doctor.cedula,
      patientNationalId: ctx.patient.cedula,
      patientFullName,
      patientEmail: ctx.patient.correo,
      procedureId: ctx.procedure.idProcedimiento,
      procedureName: ctx.procedure.nombreProcedimiento,
      startTime: slot.startTime,
      endTime: slot.endTime,
      ...(notes ? { notes } : {}),
    };

    return this.confirmBooking(body).pipe(
      tap(() => {
        this.clearBookingContext();
        this.refreshCalendar();
        this.#bookingSuccess$.next();
        this.setActiveTab(AGENDADOR_TABS.FORM);
      })
    );
  }

  /**
   * Orquesta la mutación para crear y confirmar la cita médica contra el API Gateway (POST /api/appointments)
   */
  confirmBooking(body: ICreateAppointmentBody): Observable<IApiResponse<unknown>> {
    return this.apiClient.post<unknown>('/api/appointments', body);
  }
}
