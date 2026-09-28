import { Injectable, computed, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LoaderStateService {
  /**
   * Contador reactivo privado de peticiones HTTP activas
   */
  private readonly activeRequests = signal<number>(0);

  /**
   * Estado derivado que indica si hay al menos una petición en vuelo
   */
  readonly isLoading = computed(() => this.activeRequests() > 0);

  /**
   * Incrementa el conteo de peticiones activas
   */
  show(): void {
    this.activeRequests.update((count) => count + 1);
  }

  /**
   * Decrementa el conteo de peticiones activas evitando valores negativos
   */
  hide(): void {
    this.activeRequests.update((count) => Math.max(0, count - 1));
  }
}
