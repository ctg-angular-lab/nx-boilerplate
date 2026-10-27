import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, defer, finalize, map, of, tap } from 'rxjs';
import {
  IActiveProfessional,
  ICreateProfessionalRequest,
  IProcedure,
  IUpdateProfessionalRequest,
} from '@nx-boilerplate/api-interfaces';
import { ApiClientService } from '@nx-boilerplate/data-access';
import {
  PROFESIONALES_TABS,
  ProfesionalesTabId,
} from '../models/profesionales-nav.models';

@Injectable({
  providedIn: 'root',
})
export class ProfesionalesAdminService {
  private readonly apiClient = inject(ApiClientService);

  // --- Estado de la lista ---
  readonly #profesionalesList = signal<IActiveProfessional[]>([]);
  readonly #isLoading = signal<boolean>(false);
  readonly #error = signal<string | null>(null);

  readonly profesionalesList = this.#profesionalesList.asReadonly();
  readonly isLoading = this.#isLoading.asReadonly();
  readonly error = this.#error.asReadonly();

  // --- Navegación y modo dual (alta / edición) ---
  readonly #activeTab = signal<ProfesionalesTabId>(PROFESIONALES_TABS.LIST);
  readonly #editingProfessional = signal<IActiveProfessional | null>(null);
  readonly #isSaving = signal<boolean>(false);
  readonly #saveError = signal<string | null>(null);
  readonly #procedures = signal<IProcedure[]>([]);

  readonly activeTab = this.#activeTab.asReadonly();
  readonly editingProfessional = this.#editingProfessional.asReadonly();
  readonly isSaving = this.#isSaving.asReadonly();
  readonly saveError = this.#saveError.asReadonly();
  readonly procedures = this.#procedures.asReadonly();
  readonly isEditMode = computed(() => this.#editingProfessional() !== null);

  /**
   * Consulta el catálogo de profesionales activos desde el API Gateway (GET /api/doctors).
   */
  loadProfesionales(): void {
    this.#isLoading.set(true);
    this.#error.set(null);

    this.apiClient
      .get<IActiveProfessional[]>('/api/doctors', {
        params: { includeInactive: 'true' },
      })
      .pipe(
        map((response) => response.data ?? []),
        catchError((error) => {
          console.error('Error al cargar profesionales desde API Gateway:', error);
          this.#error.set('No se pudo cargar el catálogo de profesionales.');
          return of([] as IActiveProfessional[]);
        }),
        finalize(() => this.#isLoading.set(false))
      )
      .subscribe((list) => this.#profesionalesList.set(list));
  }

  /**
   * Carga el catálogo de procedimientos (GET /api/procedures) para el selector del formulario.
   */
  loadProcedures(): void {
    this.apiClient
      .get<IProcedure[]>('/api/procedures')
      .pipe(
        map((response) => response.data ?? []),
        catchError((error) => {
          console.error('Error al cargar procedimientos desde API Gateway:', error);
          return of([] as IProcedure[]);
        })
      )
      .subscribe((list) => this.#procedures.set(list));
  }

  // --- Orquestación de navegación ---

  setActiveTab(id: ProfesionalesTabId): void {
    this.#activeTab.set(id);
    if (id === PROFESIONALES_TABS.LIST) {
      this.#editingProfessional.set(null);
      this.#saveError.set(null);
    }
  }

  goToCreate(): void {
    this.#editingProfessional.set(null);
    this.#saveError.set(null);
    this.#activeTab.set(PROFESIONALES_TABS.FORM);
  }

  goToEdit(professional: IActiveProfessional): void {
    this.#editingProfessional.set(professional);
    this.#saveError.set(null);
    this.#activeTab.set(PROFESIONALES_TABS.FORM);
  }

  goToList(): void {
    this.#editingProfessional.set(null);
    this.#saveError.set(null);
    this.#activeTab.set(PROFESIONALES_TABS.LIST);
  }

  // --- Mutaciones HTTP ---

  /**
   * Alta de profesional (POST /api/doctors).
   * Emite el profesional creado, o `null` si falló (el mensaje queda en `saveError`).
   */
  createProfesional(
    payload: ICreateProfessionalRequest
  ): Observable<IActiveProfessional | null> {
    return defer(() => {
      this.#isSaving.set(true);
      this.#saveError.set(null);

      return this.apiClient
        .post<IActiveProfessional, ICreateProfessionalRequest>('/api/doctors', payload)
        .pipe(
          map((response) => response.data),
          tap(() => {
            this.loadProfesionales();
            this.goToList();
          }),
          catchError((error) => {
            this.#saveError.set(
              this.extractErrorMessage(error, 'No se pudo registrar el profesional.')
            );
            return of(null);
          }),
          finalize(() => this.#isSaving.set(false))
        );
    });
  }

  /**
   * Actualización parcial (PATCH /api/doctors/:cedula).
   * Emite el profesional actualizado, o `null` si falló (el mensaje queda en `saveError`).
   */
  updateProfesional(
    cedula: string,
    payload: IUpdateProfessionalRequest
  ): Observable<IActiveProfessional | null> {
    return defer(() => {
      this.#isSaving.set(true);
      this.#saveError.set(null);

      return this.apiClient
        .patch<IActiveProfessional, IUpdateProfessionalRequest>(
          `/api/doctors/${encodeURIComponent(cedula)}`,
          payload
        )
        .pipe(
          map((response) => response.data),
          tap(() => {
            this.loadProfesionales();
            this.goToList();
          }),
          catchError((error) => {
            this.#saveError.set(
              this.extractErrorMessage(error, 'No se pudo actualizar el profesional.')
            );
            return of(null);
          }),
          finalize(() => this.#isSaving.set(false))
        );
    });
  }

  /**
   * Baja lógica (DELETE /api/doctors/:cedula) con Optimistic UI:
   * se marca de inmediato isActive: false en memoria y se revierte al estado previo si el backend falla.
   */
  deleteProfesional(cedula: string): Observable<boolean> {
    return defer(() => {
      const snapshot = this.#profesionalesList();
      this.#profesionalesList.update((list) =>
        list.map((p) => (p.cedula === cedula ? { ...p, isActive: false } : p))
      );

      return this.apiClient
        .delete<unknown>(`/api/doctors/${encodeURIComponent(cedula)}`)
        .pipe(
          map(() => true),
          catchError((error) => {
            this.#profesionalesList.set(snapshot);
            this.#error.set(
              this.extractErrorMessage(error, 'No se pudo eliminar el profesional.')
            );
            return of(false);
          })
        );
    });
  }

  /**
   * Reactivación de profesional (PATCH /api/doctors/:cedula con { isActive: true }) con Optimistic UI:
   * se marca inmediatamente isActive: true en memoria y se revierte al estado previo si el backend falla.
   */
  reactivateProfesional(cedula: string): Observable<boolean> {
    return defer(() => {
      const previous = this.#profesionalesList();
      this.#error.set(null);

      this.#profesionalesList.update((list) =>
        list.map((p) => (p.cedula === cedula ? { ...p, isActive: true } : p))
      );

      return this.apiClient
        .patch<IActiveProfessional, IUpdateProfessionalRequest>(
          `/api/doctors/${encodeURIComponent(cedula)}`,
          { isActive: true }
        )
        .pipe(
          map(() => true),
          catchError((error) => {
            this.#profesionalesList.set(previous);
            this.#error.set(
              this.extractErrorMessage(
                error,
                'No se pudo reactivar el profesional. Intente nuevamente.'
              )
            );
            return of(false);
          })
        );
    });
  }

  /**
   * Extrae el mensaje del backend (ej. 409 por cédula duplicada) o retorna un texto seguro por defecto.
   */
  private extractErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      const body = error.error as { message?: string | string[] } | string | null;
      if (typeof body === 'string' && body.trim()) return body;
      const message = typeof body === 'object' && body !== null ? body.message : undefined;
      if (Array.isArray(message) && message.length > 0) return message.join(' ');
      if (typeof message === 'string' && message.trim()) return message;
    }
    return fallback;
  }
}
