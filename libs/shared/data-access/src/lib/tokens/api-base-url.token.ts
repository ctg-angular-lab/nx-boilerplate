import { InjectionToken } from '@angular/core';

/**
 * Token de inyección para la URL base del API Gateway.
 * Por defecto apunta al Gateway HTTP en http://localhost:3000.
 */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => 'http://localhost:3000',
});
