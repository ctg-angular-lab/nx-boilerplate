import { HttpClient, HttpContext, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, retry } from 'rxjs';
import { IApiResponse } from '@nx-boilerplate/api-interfaces';

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

  /**
   * Petición HTTP GET genérica
   */
  get<T>(url: string, options?: RequestOptions): Observable<IApiResponse<T>> {
    return this.http.get<IApiResponse<T>>(url, options).pipe(retry(1));
  }

  /**
   * Petición HTTP POST genérica
   */
  post<T, D = unknown>(url: string, body: D, options?: RequestOptions): Observable<IApiResponse<T>> {
    return this.http.post<IApiResponse<T>>(url, body, options).pipe(retry(1));
  }
}
