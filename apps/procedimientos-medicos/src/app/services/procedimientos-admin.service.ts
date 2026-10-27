import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, defer, finalize, map, of, tap } from 'rxjs';
import {
  ICreateProcedureRequest,
  IProcedure,
  IUpdateProcedureRequest,
} from '@nx-boilerplate/api-interfaces';
import { ApiClientService } from '@nx-boilerplate/data-access';
import {
  PROCEDIMIENTOS_TABS,
  ProcedimientosTabId,
} from '../models/procedimientos-nav.models';

@Injectable({
  providedIn: 'root',
})
export class ProcedimientosAdminService {
  private readonly apiClient = inject(ApiClientService);

  // --- Estado del catálogo ---
  readonly #allProcedimientos = signal<IProcedure[]>([]);
  readonly #isLoading = signal<boolean>(false);
  readonly #error = signal<string | null>(null);

  readonly allProcedimientos = this.#allProcedimientos.asReadonly();
  readonly activeProcedimientos = computed(() =>
    this.#allProcedimientos().filter((p) => p.isActive !== false)
  );
  readonly isLoading = this.#isLoading.asReadonly();
  readonly error = this.#error.asReadonly();

  // --- Navegación y modos (alta, edición, auto-recuperación de inactivos) ---
  readonly #activeTab = signal<ProcedimientosTabId>(PROCEDIMIENTOS_TABS.LIST);
  readonly #editingProcedure = signal<IProcedure | null>(null);
  readonly #isRestoringInactive = signal<boolean>(false);
  readonly #isSaving = signal<boolean>(false);
  readonly #saveError = signal<string | null>(null);

  readonly activeTab = this.#activeTab.asReadonly();
  readonly editingProcedure = this.#editingProcedure.asReadonly();
  readonly isRestoringInactive = this.#isRestoringInactive.asReadonly();
  readonly isSaving = this.#isSaving.asReadonly();
  readonly saveError = this.#saveError.asReadonly();

  readonly isEditMode = computed(
    () => this.#editingProcedure() !== null && !this.#isRestoringInactive()
  );

  /**
   * Carga todo el catálogo de procedimientos desde el API Gateway (incluyendo inactivos).
   */
  loadProcedimientos(): void {
    this.#isLoading.set(true);
    this.#error.set(null);

    this.apiClient
      .get<IProcedure[]>('/api/procedures', {
        params: { includeInactive: 'true' },
      })
      .pipe(
        map((response) => response.data ?? []),
        catchError((error) => {
          console.error('Error al cargar procedimientos desde API Gateway:', error);
          this.#error.set('No se pudo cargar el catálogo de procedimientos.');
          return of([] as IProcedure[]);
        }),
        finalize(() => this.#isLoading.set(false))
      )
      .subscribe((list) => this.#allProcedimientos.set(list));
  }

  /**
   * Busca en el catálogo completo un procedimiento que coincida con el nombre indicado,
   * normalizando espacios, mayúsculas/minúsculas y acentos diacríticos.
   */
  findExistingByName(raw: string): IProcedure | undefined {
    if (!raw) return undefined;
    const normalized = this.normalizeText(raw);

    return this.#allProcedimientos().find((p) => {
      const pNorm = this.normalizeText(p.nombreProcedimiento);
      return pNorm === normalized;
    });
  }

  // --- Orquestación de Navegación ---

  setActiveTab(id: ProcedimientosTabId): void {
    this.#activeTab.set(id);
    if (id === PROCEDIMIENTOS_TABS.LIST) {
      this.#editingProcedure.set(null);
      this.#isRestoringInactive.set(false);
      this.#saveError.set(null);
    }
  }

  goToCreate(): void {
    this.#editingProcedure.set(null);
    this.#isRestoringInactive.set(false);
    this.#saveError.set(null);
    this.#activeTab.set(PROCEDIMIENTOS_TABS.FORM);
  }

  goToEdit(procedure: IProcedure): void {
    this.#editingProcedure.set(procedure);
    this.#isRestoringInactive.set(false);
    this.#saveError.set(null);
    this.#activeTab.set(PROCEDIMIENTOS_TABS.FORM);
  }

  startRestoreInactive(procedure: IProcedure): void {
    this.#editingProcedure.set(procedure);
    this.#isRestoringInactive.set(true);
    this.#saveError.set(null);
    this.#activeTab.set(PROCEDIMIENTOS_TABS.FORM);
  }

  goToList(): void {
    this.#editingProcedure.set(null);
    this.#isRestoringInactive.set(false);
    this.#saveError.set(null);
    this.#activeTab.set(PROCEDIMIENTOS_TABS.LIST);
  }

  // --- Mutaciones HTTP ---

  /**
   * Registro de un nuevo procedimiento (POST /api/procedures).
   */
  createProcedimiento(
    payload: ICreateProcedureRequest
  ): Observable<IProcedure | null> {
    return defer(() => {
      this.#isSaving.set(true);
      this.#saveError.set(null);

      return this.apiClient
        .post<IProcedure, ICreateProcedureRequest>('/api/procedures', payload)
        .pipe(
          map((response) => response.data),
          tap(() => {
            this.loadProcedimientos();
            this.goToList();
          }),
          catchError((error) => {
            // Ante 409 (conflicto o reintento de mutación), recargamos catálogo para sincronizar
            if (error instanceof HttpErrorResponse && error.status === 409) {
              this.loadProcedimientos();
            }
            this.#saveError.set(
              this.extractErrorMessage(error, 'No se pudo registrar el procedimiento.')
            );
            return of(null);
          }),
          finalize(() => this.#isSaving.set(false))
        );
    });
  }

  /**
   * Actualización o reactivación de procedimiento (PATCH /api/procedures/:idProcedimiento).
   */
  updateProcedimiento(
    idProcedimiento: string,
    payload: IUpdateProcedureRequest
  ): Observable<IProcedure | null> {
    return defer(() => {
      this.#isSaving.set(true);
      this.#saveError.set(null);

      return this.apiClient
        .patch<IProcedure, IUpdateProcedureRequest>(
          `/api/procedures/${encodeURIComponent(idProcedimiento)}`,
          payload
        )
        .pipe(
          map((response) => response.data),
          tap(() => {
            this.loadProcedimientos();
            this.goToList();
          }),
          catchError((error) => {
            if (error instanceof HttpErrorResponse && error.status === 409) {
              this.loadProcedimientos();
            }
            this.#saveError.set(
              this.extractErrorMessage(error, 'No se pudo actualizar el procedimiento.')
            );
            return of(null);
          }),
          finalize(() => this.#isSaving.set(false))
        );
    });
  }

  /**
   * Baja lógica con Optimistic UI (DELETE /api/procedures/:idProcedimiento).
   * Desactiva inmediatamente en memoria y revierte al snapshot si el backend responde con error
   * (por ejemplo, si el procedimiento tiene médicos vinculados y arroja 409).
   */
  deleteProcedimiento(idProcedimiento: string): Observable<boolean> {
    return defer(() => {
      const snapshot = this.#allProcedimientos();
      this.#allProcedimientos.update((list) =>
        list.map((p) =>
          p.idProcedimiento === idProcedimiento ? { ...p, isActive: false } : p
        )
      );

      return this.apiClient
        .delete<unknown>(`/api/procedures/${encodeURIComponent(idProcedimiento)}`)
        .pipe(
          map(() => true),
          catchError((error) => {
            this.#allProcedimientos.set(snapshot);
            this.#error.set(
              this.extractErrorMessage(error, 'No se pudo eliminar el procedimiento.')
            );
            return of(false);
          })
        );
    });
  }

  // --- Auxiliares ---

  private normalizeText(text: string): string {
    return text
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ');
  }

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
