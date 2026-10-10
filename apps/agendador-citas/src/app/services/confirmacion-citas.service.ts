import {
  Injectable,
  inject,
  signal,
  computed,
  effect,
  untracked,
  DestroyRef,
} from '@angular/core';
import { Observable, catchError, finalize, of, tap } from 'rxjs';
import { ApiClientService } from '@nx-boilerplate/data-access';
import {
  IAppointmentDashboard,
  AppointmentConfirmationStatus,
} from '@nx-boilerplate/api-interfaces';
import {
  formatDateYMD,
  getColombiaToday,
} from '@nx-boilerplate/shared/utils';

export interface DashboardSummaryStats {
  total: number;
  tentative: number;
  confirmed: number;
  cancelled: number;
}

@Injectable({
  providedIn: 'root',
})
export class ConfirmacionCitasService {
  private readonly apiClient = inject(ApiClientService);
  private readonly destroyRef = inject(DestroyRef);

  // -------------------------------------------------------------------------
  // Signals Privados de Estado (Filtros)
  // -------------------------------------------------------------------------
  readonly #selectedDate = signal<string>(formatDateYMD(getColombiaToday()));
  readonly #selectedStatus = signal<AppointmentConfirmationStatus | 'ALL'>('TENTATIVE');
  readonly #searchQuery = signal<string>('');
  readonly #selectedDoctorEmail = signal<string | null>(null);

  // -------------------------------------------------------------------------
  // Signals Privados de Datos y Control
  // -------------------------------------------------------------------------
  readonly #dailyAppointments = signal<IAppointmentDashboard[]>([]);
  readonly #isLoadingDashboard = signal<boolean>(false);
  readonly #error = signal<string | null>(null);

  // -------------------------------------------------------------------------
  // Exposición Pública (Readonly Signals)
  // -------------------------------------------------------------------------
  readonly selectedDate = this.#selectedDate.asReadonly();
  readonly selectedStatus = this.#selectedStatus.asReadonly();
  readonly searchQuery = this.#searchQuery.asReadonly();
  readonly selectedDoctorEmail = this.#selectedDoctorEmail.asReadonly();
  readonly dailyAppointments = this.#dailyAppointments.asReadonly();
  readonly isLoadingDashboard = this.#isLoadingDashboard.asReadonly();
  readonly error = this.#error.asReadonly();

  // -------------------------------------------------------------------------
  // Señales Computadas
  // -------------------------------------------------------------------------
  /**
   * Citas filtradas localmente por el texto de búsqueda (nombre, cédula, teléfono o procedimiento).
   */
  readonly filteredAppointments = computed<IAppointmentDashboard[]>(() => {
    const list = this.#dailyAppointments();
    const query = this.#searchQuery().trim().toLowerCase();

    if (!query) {
      return list;
    }

    return list.filter((item) => {
      const matchName = item.patientFullName?.toLowerCase().includes(query) ?? false;
      const matchDoc = item.patientNationalId?.toLowerCase().includes(query) ?? false;
      const matchPhone = item.patientPhone?.toLowerCase().includes(query) ?? false;
      const matchProc = item.procedureName?.toLowerCase().includes(query) ?? false;
      return matchName || matchDoc || matchPhone || matchProc;
    });
  });

  /**
   * Estadísticas de conteo de citas para badges y pestañas de resumen.
   */
  readonly summaryStats = computed<DashboardSummaryStats>(() => {
    const list = this.#dailyAppointments();
    return {
      total: list.length,
      tentative: list.filter((a) => a.status === 'TENTATIVE').length,
      confirmed: list.filter((a) => a.status === 'CONFIRMED').length,
      cancelled: list.filter((a) => a.status === 'CANCELLED').length,
    };
  });

  // -------------------------------------------------------------------------
  // Constructor con Reacción Automática (Effect)
  // -------------------------------------------------------------------------
  constructor() {
    effect(() => {
      // Registrar dependencias reactivas de filtros
      this.#selectedDate();
      this.#selectedStatus();
      this.#selectedDoctorEmail();

      // Disparar la consulta en un contexto no rastreado para evitar ciclos o dependencias involuntarias
      untracked(() => {
        this.fetchDailyAppointments();
      });
    });
  }

  // -------------------------------------------------------------------------
  // Mutadores de Filtros
  // -------------------------------------------------------------------------
  setSelectedDate(date: string | Date): void {
    const dateStr = typeof date === 'string' ? date : formatDateYMD(date);
    this.#selectedDate.set(dateStr);
  }

  setSelectedStatus(status: AppointmentConfirmationStatus | 'ALL'): void {
    this.#selectedStatus.set(status);
  }

  setSearchQuery(query: string): void {
    this.#searchQuery.set(query);
  }

  setSelectedDoctorEmail(email: string | null): void {
    this.#selectedDoctorEmail.set(email);
  }

  // -------------------------------------------------------------------------
  // Acciones HTTP
  // -------------------------------------------------------------------------
  /**
   * Consulta las citas del día actual según los filtros seleccionados.
   */
  fetchDailyAppointments(): void {
    this.#isLoadingDashboard.set(true);
    this.#error.set(null);

    const params: Record<string, string> = {
      date: this.#selectedDate(),
    };

    const status = this.#selectedStatus();
    if (status && status !== 'ALL') {
      params['status'] = status;
    }

    const doctorEmail = this.#selectedDoctorEmail();
    if (doctorEmail) {
      params['doctorEmail'] = doctorEmail;
    }

    this.apiClient
      .get<IAppointmentDashboard[]>('/api/appointments/daily', { params })
      .pipe(
        tap((response) => {
          this.#dailyAppointments.set(response.data ?? []);
        }),
        catchError((err: Error) => {
          this.#error.set(err.message || 'Error al cargar las citas del dashboard');
          this.#dailyAppointments.set([]);
          return of(null);
        }),
        finalize(() => {
          this.#isLoadingDashboard.set(false);
        }),
      )
      .subscribe();
  }

  /**
   * Actualiza el estado de una cita aplicando una mutación optimista inmediata
   * y revirtiendo el estado en caso de fallo en el servidor.
   */
  updateAppointmentStatus(
    id: string,
    newStatus: 'CONFIRMED' | 'CANCELLED'
  ): Observable<boolean> {
    const previous = this.#dailyAppointments();

    // Mutación optimista en memoria
    this.#dailyAppointments.update((appointments) =>
      appointments.map((apt) =>
        apt.appointmentId === id || (apt as any)._id === id
          ? { ...apt, status: newStatus }
          : apt
      )
    );

    return new Observable<boolean>((observer) => {
      this.apiClient
        .patch<IAppointmentDashboard>(`/api/appointments/${id}/status`, {
          status: newStatus,
        })
        .pipe(
          tap((response) => {
            if (response.data) {
              // Sincronizar datos retornados por el servidor (ej. colorId)
              this.#dailyAppointments.update((appointments) =>
                appointments.map((apt) =>
                  apt.appointmentId === id || (apt as any)._id === id
                    ? { ...apt, ...response.data }
                    : apt
                )
              );
            }
            observer.next(true);
            observer.complete();
          }),
          catchError((err: Error) => {
            // Rollback en caso de error
            this.#dailyAppointments.set(previous);
            this.#error.set(err.message || 'Error al actualizar el estado de la cita');
            observer.error(err);
            return of(null);
          }),
        )
        .subscribe();
    });
  }

  /**
   * Registra el contacto por WhatsApp incrementando optimistamente el contador
   * y despachando la acción asíncrona fire-and-forget.
   */
  trackWhatsAppContact(id: string): Observable<boolean> {
    // Incremento optimista local
    this.#dailyAppointments.update((appointments) =>
      appointments.map((apt) =>
        apt.appointmentId === id || (apt as any)._id === id
          ? { ...apt, contactCount: (apt.contactCount ?? 0) + 1 }
          : apt
      )
    );

    return new Observable<boolean>((observer) => {
      this.apiClient
        .post(`/api/appointments/${id}/track-contact`, {})
        .pipe(
          tap(() => {
            observer.next(true);
            observer.complete();
          }),
          catchError((err: Error) => {
            // Al ser fire-and-forget 202 Accepted, el fallo no interrumpe el flujo UI
            observer.next(false);
            observer.complete();
            return of(null);
          }),
        )
        .subscribe();
    });
  }
}
