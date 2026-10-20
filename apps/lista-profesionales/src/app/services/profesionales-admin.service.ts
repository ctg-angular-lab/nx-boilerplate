import { Injectable, inject, signal } from '@angular/core';
import { catchError, finalize, map, of } from 'rxjs';
import { IActiveProfessional } from '@nx-boilerplate/api-interfaces';
import { ApiClientService } from '@nx-boilerplate/data-access';

@Injectable({
  providedIn: 'root',
})
export class ProfesionalesAdminService {
  private readonly apiClient = inject(ApiClientService);

  readonly #profesionalesList = signal<IActiveProfessional[]>([]);
  readonly #isLoading = signal<boolean>(false);
  readonly #error = signal<string | null>(null);

  readonly profesionalesList = this.#profesionalesList.asReadonly();
  readonly isLoading = this.#isLoading.asReadonly();
  readonly error = this.#error.asReadonly();

  /**
   * Consulta el catálogo de profesionales activos desde el API Gateway (GET /api/doctors).
   */
  loadProfesionales(): void {
    this.#isLoading.set(true);
    this.#error.set(null);

    this.apiClient
      .get<IActiveProfessional[]>('/api/doctors')
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
}
