import { HttpClient, HttpContext, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, retry } from 'rxjs';
import { IApiResponse } from '@nx-boilerplate/api-interfaces';
import { API_BASE_URL } from '../tokens/api-base-url.token';

export interface RequestOptions {
  headers?: HttpHeaders | Record<string, string | string[]>;
  params?: HttpParams | Record<string, string | number | boolean | readonly (string | number | boolean)[]>;
  context?: HttpContext;
}

@Injectable({
  providedIn: 'root',
})
export class ApiClientService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  /**
   * Resuelve URLs relativas anteponiendo la URL base configurada.
   */
  private resolveUrl(path: string): string {
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    const cleanBase = this.baseUrl.replace(/\/+$/, '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${cleanBase}${cleanPath}`;
  }

  /**
   * Petición HTTP GET genérica
   */
  get<T>(url: string, options?: RequestOptions): Observable<IApiResponse<T>> {
    return this.http.get<IApiResponse<T>>(this.resolveUrl(url), options).pipe(retry(1));
  }

  /**
   * Petición HTTP POST genérica
   */
  post<T, D = unknown>(url: string, body: D, options?: RequestOptions): Observable<IApiResponse<T>> {
    return this.http.post<IApiResponse<T>>(this.resolveUrl(url), body, options).pipe(retry(1));
  }

  /**
   * Petición HTTP PUT genérica
   */
  put<T, D = unknown>(url: string, body: D, options?: RequestOptions): Observable<IApiResponse<T>> {
    return this.http.put<IApiResponse<T>>(this.resolveUrl(url), body, options).pipe(retry(1));
  }

  /**
   * Petición HTTP DELETE genérica
   */
  delete<T>(url: string, options?: RequestOptions): Observable<IApiResponse<T>> {
    return this.http.delete<IApiResponse<T>>(this.resolveUrl(url), options).pipe(retry(1));
  }

  /**
   * Petición HTTP PATCH genérica
   */
  patch<T, D = unknown>(url: string, body: D, options?: RequestOptions): Observable<IApiResponse<T>> {
    return this.http.patch<IApiResponse<T>>(this.resolveUrl(url), body, options).pipe(retry(1));
  }
}

