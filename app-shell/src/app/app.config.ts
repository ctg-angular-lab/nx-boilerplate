import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { loaderInterceptor } from '@nx-boilerplate/data-access';
import { appRoutes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideBrowserGlobalErrorListeners(),
    provideRouter(appRoutes),
    // Requerido por los remotes (MFE) cargados vía Module Federation: sus app.config.ts no se ejecutan dentro del shell.
    provideHttpClient(withInterceptors([loaderInterceptor])),
  ],
};
