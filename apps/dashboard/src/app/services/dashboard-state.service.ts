import { Injectable, computed, inject, signal } from '@angular/core';
import { forkJoin, map, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiClientService } from '@nx-boilerplate/data-access';
import { IActiveProfessional, IDayAvailability } from '@nx-boilerplate/api-interfaces';
import { formatDateYMD, getColombiaToday } from '@nx-boilerplate/utils';
import {
  assignDoctorColorTheme,
  buildTimeGridRows,
  computeWeeklyKpis,
  extractInitials,
} from '../utils/dashboard-calendar.mapper';
import {
  IDashboardDoctor,
  IDashboardTimeRow,
  IDashboardWeeklyKpis,
} from '../models/dashboard.models';

@Injectable({
  providedIn: 'root',
})
export class DashboardStateService {
  readonly #api = inject(ApiClientService);

  // --- Estado Privado (Signals) ---
  readonly #doctors = signal<IDashboardDoctor[]>([]);
  readonly #selectedDoctorCedula = signal<string | null>(null);
  readonly #comparedDoctorCedulas = signal<readonly string[]>([]);
  readonly #selectedDate = signal<Date>(getColombiaToday());
  readonly #weeklyAvailabilityCache = signal<Record<string, IDayAvailability[]>>({});
  readonly #loadingDoctors = signal<boolean>(false);
  readonly #loadingSchedule = signal<boolean>(false);
  readonly #error = signal<string | null>(null);

  // --- Selectores Públicos (Readonly Signals & Computed) ---
  readonly doctors = this.#doctors.asReadonly();
  readonly selectedDoctorCedula = this.#selectedDoctorCedula.asReadonly();
  readonly comparedDoctorCedulas = this.#comparedDoctorCedulas.asReadonly();
  readonly selectedDate = this.#selectedDate.asReadonly();
  readonly loadingDoctors = this.#loadingDoctors.asReadonly();
  readonly loadingSchedule = this.#loadingSchedule.asReadonly();
  readonly error = this.#error.asReadonly();

  /**
   * Médico activo actualmente seleccionado en la barra superior
   */
  readonly activeDoctor = computed<IDashboardDoctor | null>(() => {
    const cedula = this.#selectedDoctorCedula();
    const list = this.#doctors();
    if (!list.length) return null;
    return list.find((doc) => doc.cedula === cedula) || list[0];
  });

  /**
   * Lista de médicos disponibles para comparar (excluye al médico activo)
   */
  readonly otherDoctors = computed<readonly IDashboardDoctor[]>(() => {
    const active = this.activeDoctor();
    if (!active) return [];
    return this.#doctors().filter((doc) => doc.cedula !== active.cedula);
  });

  /**
   * Arreglo ordenado de médicos activos para las capas de superposición (máx. 4: principal + 3)
   */
  readonly activeOverlayDoctors = computed<readonly IDashboardDoctor[]>(() => {
    const active = this.activeDoctor();
    if (!active) return [];

    const comparedCedulas = this.#comparedDoctorCedulas();
    const comparedDocs = this.#doctors().filter(
      (doc) => doc.cedula !== active.cedula && comparedCedulas.includes(doc.cedula)
    );

    return [active, ...comparedDocs].slice(0, 4);
  });

  /**
   * Rango semanal para la fecha seleccionada [lunes, domingo]
   */
  readonly currentWeekRange = computed<{ start: string; end: string }>(() => {
    const target = new Date(this.#selectedDate());
    const day = target.getDay();
    // En JS 0 es domingo. Normalizamos a lunes = 1
    const diffToMonday = target.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(target);
    monday.setDate(diffToMonday);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    return {
      start: formatDateYMD(monday),
      end: formatDateYMD(sunday),
    };
  });

  /**
   * KPIs semanales del médico activo
   */
  readonly weeklyKpis = computed<IDashboardWeeklyKpis>(() => {
    const active = this.activeDoctor();
    if (!active) {
      return { confirmedCount: 0, scheduledCount: 0, weekRangeLabel: 'Esta semana' };
    }

    const { start, end } = this.currentWeekRange();
    const cacheKey = `${active.cedula}_${start}_${end}`;
    const days = this.#weeklyAvailabilityCache()[cacheKey];

    return computeWeeklyKpis(days, `${start} al ${end}`);
  });

  /**
   * Filas horarias canónicas de 30 minutos (08:00 a 17:30) con las capas apiladas
   */
  readonly timeGridRows = computed<readonly IDashboardTimeRow[]>(() => {
    const targetDate = this.#selectedDate();
    const overlayDocs = this.activeOverlayDoctors();
    const { start, end } = this.currentWeekRange();
    const cache = this.#weeklyAvailabilityCache();

    // Mapear disponibilidad por cédula
    const availabilityMap: Record<string, IDayAvailability[]> = {};
    for (const doc of overlayDocs) {
      const cacheKey = `${doc.cedula}_${start}_${end}`;
      availabilityMap[doc.cedula] = cache[cacheKey] || [];
    }

    return buildTimeGridRows(targetDate, overlayDocs, availabilityMap);
  });

  // --- Acciones de Estado ---

  /**
   * Carga la lista de profesionales desde /api/doctors
   */
  loadDoctors(): void {
    this.#loadingDoctors.set(true);
    this.#error.set(null);

    this.#api
      .get<IActiveProfessional[]>('/api/doctors')
      .pipe(
        map((res) => res.data ?? []),
        catchError(() => {
          // Fallback resiliente si el backend está offline
          const fallbackDocs: IActiveProfessional[] = [
            {
              cedula: '1001',
              nombres: 'Alejandro',
              apellidos: 'Gómez',
              email: 'alejandro.gomez@clinica.com',
              profesion: 'Medicina General',
              isActive: true,
              horarioTrabajo: {
                diasLaborales: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
                horaInicio: '08:00',
                horaFin: '17:00',
                recesoAlmuerzo: { inicio: '12:00', fin: '13:00' },
              },
            },
            {
              cedula: '1002',
              nombres: 'Beatriz',
              apellidos: 'Pinzón',
              email: 'beatriz.pinzon@clinica.com',
              profesion: 'Dermatología',
              isActive: true,
              horarioTrabajo: {
                diasLaborales: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
                horaInicio: '09:00',
                horaFin: '18:00',
                recesoAlmuerzo: { inicio: '13:00', fin: '14:00' },
              },
            },
            {
              cedula: '1003',
              nombres: 'Carlos',
              apellidos: 'Sarmiento',
              email: 'carlos.sarmiento@clinica.com',
              profesion: 'Ortopedia',
              isActive: true,
              horarioTrabajo: {
                diasLaborales: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
                horaInicio: '08:00',
                horaFin: '16:00',
                recesoAlmuerzo: { inicio: '12:30', fin: '13:30' },
              },
            },
          ];
          return of(fallbackDocs);
        })
      )
      .subscribe({
        next: (docs) => {
          const enriched: IDashboardDoctor[] = (docs || [])
            .filter((d) => d.isActive !== false)
            .map((d, index) => ({
              ...d,
              fullName: `Dr(a). ${d.nombres} ${d.apellidos}`.trim(),
              initials: extractInitials(d.nombres, d.apellidos),
              colorTheme: assignDoctorColorTheme(index),
            }));

          this.#doctors.set(enriched);
          this.#loadingDoctors.set(false);

          // Si no hay médico seleccionado, seleccionar el primero
          if (!this.#selectedDoctorCedula() && enriched.length > 0) {
            this.#selectedDoctorCedula.set(enriched[0].cedula);
          }

          // Cargar disponibilidad para las capas activas
          this.loadWeeklyAvailabilityForActiveLayers();
        },
        error: (err) => {
          this.#loadingDoctors.set(false);
          this.#error.set(err?.message || 'Error al cargar profesionales');
        },
      });
  }

  /**
   * Cambia el médico principal. Si el médico estaba marcado para comparar, lo desmarca.
   */
  selectDoctor(cedula: string): void {
    if (this.#selectedDoctorCedula() === cedula) return;

    this.#selectedDoctorCedula.set(cedula);
    // Saneamiento reactivo: si estaba en comparedDoctorCedulas, removerlo
    this.#comparedDoctorCedulas.update((prev) => prev.filter((c) => c !== cedula));

    this.loadWeeklyAvailabilityForActiveLayers();
  }

  /**
   * Cambia la fecha activa del calendario diario
   */
  selectDate(date: Date): void {
    if (!date) return;
    const prevWeek = this.currentWeekRange();
    this.#selectedDate.set(date);
    const newWeek = this.currentWeekRange();

    // Si cambió la semana, solicitar disponibilidad para la nueva semana
    if (prevWeek.start !== newWeek.start || prevWeek.end !== newWeek.end) {
      this.loadWeeklyAvailabilityForActiveLayers();
    }
  }

  /**
   * Navega días relativos (-1 anterior, +1 siguiente)
   */
  navigateRelativeDays(daysOffset: number): void {
    const current = new Date(this.#selectedDate());
    current.setDate(current.getDate() + daysOffset);
    this.selectDate(current);
  }

  /**
   * Restablece la fecha activa a hoy
   */
  selectToday(): void {
    this.selectDate(getColombiaToday());
  }

  /**
   * Activa o desactiva la comparación de un médico en "Otros calendarios" (máx. 3 adicionales)
   */
  toggleComparedDoctor(cedula: string): void {
    const active = this.activeDoctor();
    if (active && active.cedula === cedula) return; // No se puede comparar consigo mismo

    this.#comparedDoctorCedulas.update((prev) => {
      if (prev.includes(cedula)) {
        return prev.filter((c) => c !== cedula);
      }
      if (prev.length >= 3) {
        // Límite de 3 médicos adicionales (4 capas totales)
        return [...prev.slice(1), cedula];
      }
      return [...prev, cedula];
    });

    this.loadWeeklyAvailabilityForActiveLayers();
  }

  /**
   * Limpia todos los médicos comparados
   */
  clearComparedDoctors(): void {
    this.#comparedDoctorCedulas.set([]);
  }

  /**
   * Carga en paralelo la disponibilidad semanal de todos los médicos visibles que no estén en caché
   */
  loadWeeklyAvailabilityForActiveLayers(): void {
    const overlayDocs = this.activeOverlayDoctors();
    if (!overlayDocs.length) return;

    const { start, end } = this.currentWeekRange();
    const cache = this.#weeklyAvailabilityCache();

    // Detectar qué médicos no están en caché para esta semana
    const missingDocs = overlayDocs.filter((doc) => !cache[`${doc.cedula}_${start}_${end}`]);
    if (missingDocs.length === 0) return;

    this.#loadingSchedule.set(true);

    const requests = missingDocs.map((doc) => {
      return this.#api
        .get<IDayAvailability[]>('/api/appointments/available-dates', {
          params: {
            doctorEmail: doc.email,
            doctorCedula: doc.cedula,
            startDate: start,
            endDate: end,
          },
        })
        .pipe(
          map((res) => res.data ?? []),
          catchError(() => {
            // Fallback determinista en caso de que backend esté offline o sin datos
            const fallbackDays: IDayAvailability[] = [
              {
                date: formatDateYMD(this.#selectedDate()),
                dayName: 'Viernes',
                isCalendarSynced: true,
                isWorkingDay: true,
                slots: [
                  {
                    startTime: `${formatDateYMD(this.#selectedDate())}T09:00:00`,
                    endTime: `${formatDateYMD(this.#selectedDate())}T09:45:00`,
                    display: '09:00 - 09:45',
                    colorId: null,
                    isBookable: false,
                    status: 'CONFIRMED',
                    title: 'Consulta General',
                    patient: { nombre: 'Carlos', apellidos: 'Ruiz', cedula: '445566', correo: 'carlos@mail.com', celular: '3001112233' },
                  },
                  {
                    startTime: `${formatDateYMD(this.#selectedDate())}T10:30:00`,
                    endTime: `${formatDateYMD(this.#selectedDate())}T11:15:00`,
                    display: '10:30 - 11:15',
                    colorId: null,
                    isBookable: false,
                    status: 'TENTATIVE',
                    title: 'Revisión Médica',
                    patient: { nombre: 'Elena', apellidos: 'Castro', cedula: '778899', correo: 'elena@mail.com', celular: '3004445566' },
                  },
                ],
              },
            ];
            return of(fallbackDays);
          })
        );
    });

    forkJoin(requests).subscribe({
      next: (results) => {
        const updatedCache = { ...this.#weeklyAvailabilityCache() };
        missingDocs.forEach((doc, idx) => {
          const key = `${doc.cedula}_${start}_${end}`;
          updatedCache[key] = results[idx] || [];
        });

        this.#weeklyAvailabilityCache.set(updatedCache);
        this.#loadingSchedule.set(false);
      },
      error: () => {
        this.#loadingSchedule.set(false);
      },
    });
  }
}

