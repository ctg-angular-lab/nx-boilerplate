import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, forkJoin, map, of, tap, throwError } from 'rxjs';
import {
  IActiveProfessional,
  ICitaMedica,
  ICreateClinicalRecordRequest,
  ICreatePatientRequest,
  IPatientHistory,
  IProcedure,
  IUpdateClinicalRecordRequest,
  IUpdatePatientRequest,
} from '@nx-boilerplate/api-interfaces';
import { ApiClientService } from '@nx-boilerplate/data-access';
import { calculateAgeFromBirthDate } from '@nx-boilerplate/utils';
import {
  HISTORIAL_TABS,
  HistorialTabId,
  IClinicalRecordRow,
  IPatientDirectoryRow,
  isDemographicComplete,
} from '../models/historial-pacientes.models';

@Injectable({
  providedIn: 'root',
})
export class HistorialPacientesService {
  private readonly apiClient = inject(ApiClientService);

  // --- Estado de la lista y expediente ---
  readonly #patientsList = signal<IPatientHistory[]>([]);
  readonly #selectedPatient = signal<IPatientHistory | null>(null);
  readonly #clinicalRecords = signal<ICitaMedica[]>([]);
  readonly #doctors = signal<IActiveProfessional[]>([]);
  readonly #procedures = signal<IProcedure[]>([]);

  // --- Navegación y pestañas ---
  readonly #activeTab = signal<HistorialTabId>(HISTORIAL_TABS.DIRECTORY);

  // --- Indicadores asíncronos y errores ---
  readonly #isLoading = signal<boolean>(false);
  readonly #isLoadingRecords = signal<boolean>(false);
  readonly #isSaving = signal<boolean>(false);
  readonly #error = signal<string | null>(null);
  readonly #saveError = signal<string | null>(null);

  // --- Exposición de Señales Readonly ---
  readonly patientsList = this.#patientsList.asReadonly();
  readonly selectedPatient = this.#selectedPatient.asReadonly();
  readonly clinicalRecords = this.#clinicalRecords.asReadonly();
  readonly doctors = this.#doctors.asReadonly();
  readonly procedures = this.#procedures.asReadonly();
  readonly activeTab = this.#activeTab.asReadonly();
  readonly isLoading = this.#isLoading.asReadonly();
  readonly isLoadingRecords = this.#isLoadingRecords.asReadonly();
  readonly isSaving = this.#isSaving.asReadonly();
  readonly error = this.#error.asReadonly();
  readonly saveError = this.#saveError.asReadonly();

  // --- Señales Computadas ---
  readonly hasSelectedPatient = computed(() => this.#selectedPatient() !== null);

  readonly directoryRows = computed<IPatientDirectoryRow[]>(() => {
    return this.#patientsList().map((p) => {
      const calculatedAge = calculateAgeFromBirthDate(p.fecha_nacimiento);
      const isComplete = isDemographicComplete(p);
      const nombreCompleto = `${p.nombre || ''} ${p.apellidos || ''}`.trim();

      return {
        cedula: p.cedula,
        tipo_documento: p.tipo_documento || 'CC',
        nombre: p.nombre,
        apellidos: p.apellidos,
        nombreCompleto: nombreCompleto || p.cedula,
        correo: p.correo,
        celular: p.celular,
        edad: p.edad ?? calculatedAge,
        estadoFicha: isComplete ? 'COMPLETA' : 'INCOMPLETA',
        estadoFichaLabel: isComplete ? 'Completa' : 'Incompleta',
        raw: p,
      };
    });
  });

  readonly clinicalRecordRows = computed<IClinicalRecordRow[]>(() => {
    return this.#clinicalRecords().map((record, index) => {
      const firstDoctor = record.medico_tratante?.[0];
      const medicoCedula = firstDoctor?.cedula_profesional || '';
      const medicoNombre = this.resolveDoctorName(
        medicoCedula,
        firstDoctor?.nombre_profesional
      );
      const estado = record.estado_registro || 'PENDIENTE_ATENCION';
      const rowId =
        (record as { _id?: string })._id ||
        record.appointmentId ||
        `record-${index}`;

      const rawFecha = firstDoctor?.fecha_atencion;
      const fechaAtencion =
        rawFecha instanceof Date
          ? rawFecha.toISOString().split('T')[0]
          : typeof rawFecha === 'string'
          ? rawFecha
          : 'Sin fecha';

      return {
        id: rowId,
        appointmentIdDisplay: record.appointmentId || 'Manual',
        fechaAtencion,
        procedimientoRealizado:
          record.registro_clinico?.procedimiento_realizado || 'No especificado',
        medicoCedula,
        medicoNombre,
        estadoRegistro: estado,
        estadoRegistroLabel:
          estado === 'COMPLETADA' ? 'Completada' : 'Pendiente de Atención',
        raw: record,
      };
    });
  });

  // --- Operaciones de Carga ---

  /**
   * Carga el directorio general de pacientes (GET /api/patients).
   */
  loadPatients(): void {
    this.#isLoading.set(true);
    this.#error.set(null);

    this.apiClient
      .get<IPatientHistory[]>('/api/patients')
      .pipe(
        map((res) => res.data ?? []),
        catchError((err) => {
          console.error('Error al cargar pacientes:', err);
          this.#error.set('No se pudo cargar la lista de pacientes.');
          return of([] as IPatientHistory[]);
        }),
        finalize(() => this.#isLoading.set(false))
      )
      .subscribe((list) => this.#patientsList.set(list));
  }

  /**
   * Carga el catálogo de profesionales médicos (GET /api/doctors?includeInactive=true).
   */
  loadDoctors(): void {
    this.apiClient
      .get<IActiveProfessional[]>('/api/doctors', {
        params: { includeInactive: 'true' },
      })
      .pipe(
        map((res) => res.data ?? []),
        catchError((err) => {
          console.error('Error al cargar profesionales:', err);
          return of([] as IActiveProfessional[]);
        })
      )
      .subscribe((doctors) => this.#doctors.set(doctors));
  }

  /**
   * Carga el catálogo de procedimientos disponibles (GET /api/procedures).
   */
  loadProcedures(): void {
    this.apiClient
      .get<IProcedure[]>('/api/procedures')
      .pipe(
        map((res) => res.data ?? []),
        catchError((err) => {
          console.error('Error al cargar procedimientos:', err);
          return of([] as IProcedure[]);
        })
      )
      .subscribe((procs) => this.#procedures.set(procs));
  }

  /**
   * Carga concurrentemente los datos del paciente y su historial de atenciones clínicas,
   * actualiza el estado y conmuta automáticamente a la pestaña Tab 2 (Expediente).
   */
  selectAndLoadPatientExpediente(cedula: string): void {
    this.#isLoadingRecords.set(true);
    this.#error.set(null);

    forkJoin({
      patientRes: this.apiClient
        .get<IPatientHistory>(`/api/patients/${cedula}`)
        .pipe(map((res) => res.data)),
      recordsRes: this.apiClient
        .get<ICitaMedica[]>(`/api/patients/${cedula}/clinical-records`)
        .pipe(
          map((res) => res.data ?? []),
          catchError(() => of([] as ICitaMedica[]))
        ),
    })
      .pipe(
        catchError((err) => {
          console.error(`Error al cargar expediente del paciente ${cedula}:`, err);
          this.#error.set(`No se pudo cargar el expediente del paciente ${cedula}.`);
          return of({ patientRes: null, recordsRes: [] as ICitaMedica[] });
        }),
        finalize(() => this.#isLoadingRecords.set(false))
      )
      .subscribe(({ patientRes, recordsRes }) => {
        if (patientRes) {
          this.#selectedPatient.set(patientRes);
          this.#clinicalRecords.set(recordsRes);
          this.#activeTab.set(HISTORIAL_TABS.EXPEDIENTE);
        }
      });
  }

  // --- Orquestación de Navegación y Selección ---

  setActiveTab(tab: HistorialTabId): void {
    this.#activeTab.set(tab);
  }

  setSelectedPatient(patient: IPatientHistory | null): void {
    this.#selectedPatient.set(patient);
  }

  clearSelectedPatient(): void {
    this.#selectedPatient.set(null);
    this.#clinicalRecords.set([]);
    this.#activeTab.set(HISTORIAL_TABS.DIRECTORY);
  }

  // --- Operaciones de Mutación (Crear / Actualizar Paciente) ---

  createPatient(dto: ICreatePatientRequest): Observable<IPatientHistory> {
    this.#isSaving.set(true);
    this.#saveError.set(null);

    return this.apiClient.post<IPatientHistory>('/api/patients', dto).pipe(
      map((res) => {
        if (!res.data) {
          throw new Error('Respuesta inválida del servidor al crear paciente');
        }
        return res.data;
      }),
      tap((newPatient) => {
        this.#patientsList.update((prev) => [newPatient, ...prev]);
      }),
      catchError((err) => {
        const msg =
          err?.error?.message ||
          err?.message ||
          'Error al registrar el nuevo paciente.';
        this.#saveError.set(Array.isArray(msg) ? msg.join(', ') : msg);
        return throwError(() => err);
      }),
      finalize(() => this.#isSaving.set(false))
    );
  }

  updatePatient(
    cedula: string,
    dto: IUpdatePatientRequest
  ): Observable<IPatientHistory> {
    this.#isSaving.set(true);
    this.#saveError.set(null);

    return this.apiClient
      .patch<IPatientHistory>(`/api/patients/${cedula}`, dto)
      .pipe(
        map((res) => {
          if (!res.data) {
            throw new Error('Respuesta inválida del servidor al actualizar paciente');
          }
          return res.data;
        }),
        tap((updated) => {
          this.#patientsList.update((prev) =>
            prev.map((p) => (p.cedula === cedula ? updated : p))
          );
          if (this.#selectedPatient()?.cedula === cedula) {
            this.#selectedPatient.set(updated);
          }
        }),
        catchError((err) => {
          const msg =
            err?.error?.message ||
            err?.message ||
            'Error al actualizar la información del paciente.';
          this.#saveError.set(Array.isArray(msg) ? msg.join(', ') : msg);
          return throwError(() => err);
        }),
        finalize(() => this.#isSaving.set(false))
      );
  }

  // --- Operaciones de Mutación (Crear / Actualizar Registro Clínico) ---

  createClinicalRecord(
    dto: ICreateClinicalRecordRequest
  ): Observable<ICitaMedica> {
    this.#isSaving.set(true);
    this.#saveError.set(null);

    return this.apiClient.post<ICitaMedica>('/api/clinical-records', dto).pipe(
      map((res) => {
        if (!res.data) {
          throw new Error('Respuesta inválida al registrar la historia clínica');
        }
        return res.data;
      }),
      tap((newRecord) => {
        this.#clinicalRecords.update((prev) => [newRecord, ...prev]);
      }),
      catchError((err) => {
        const msg =
          err?.error?.message ||
          err?.message ||
          'Error al registrar la atención clínica.';
        this.#saveError.set(Array.isArray(msg) ? msg.join(', ') : msg);
        return throwError(() => err);
      }),
      finalize(() => this.#isSaving.set(false))
    );
  }

  updateClinicalRecord(
    id: string,
    dto: IUpdateClinicalRecordRequest
  ): Observable<ICitaMedica> {
    this.#isSaving.set(true);
    this.#saveError.set(null);

    return this.apiClient
      .patch<ICitaMedica>(`/api/clinical-records/${id}`, dto)
      .pipe(
        map((res) => {
          if (!res.data) {
            throw new Error('Respuesta inválida al actualizar la historia clínica');
          }
          return res.data;
        }),
        tap((updated) => {
          this.#clinicalRecords.update((prev) =>
            prev.map((r) => {
              const rowId = (r as { _id?: string })._id || r.appointmentId;
              return rowId === id ? updated : r;
            })
          );
        }),
        catchError((err) => {
          const msg =
            err?.error?.message ||
            err?.message ||
            'Error al guardar la atención clínica.';
          this.#saveError.set(Array.isArray(msg) ? msg.join(', ') : msg);
          return throwError(() => err);
        }),
        finalize(() => this.#isSaving.set(false))
      );
  }

  // --- Resolutores de Nombres ---

  resolveDoctorName(
    cedula?: string | null,
    fallback?: string | null
  ): string {
    if (!cedula) {
      return fallback || 'No asignado';
    }
    const found = this.#doctors().find((d) => d.cedula === cedula);
    if (found) {
      return `${found.nombres} ${found.apellidos}`.trim();
    }
    return fallback || cedula;
  }

  resolveProcedureName(
    procedureId?: string | null,
    fallback?: string | null
  ): string {
    if (!procedureId) {
      return fallback || 'No asignado';
    }
    const found = this.#procedures().find(
      (p) => p.idProcedimiento === procedureId
    );
    return found?.nombreProcedimiento || fallback || procedureId;
  }
}
