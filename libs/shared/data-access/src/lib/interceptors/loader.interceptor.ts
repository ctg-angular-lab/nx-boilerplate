import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { LoaderStateService } from '../services/loader-state.service';

/**
 * Interceptor funcional para la gestión del indicador de carga global
 */
export const loaderInterceptor: HttpInterceptorFn = (req, next) => {
  const loaderState = inject(LoaderStateService);

  loaderState.show();

  return next(req).pipe(
    finalize(() => {
      loaderState.hide();
    })
  );
};
