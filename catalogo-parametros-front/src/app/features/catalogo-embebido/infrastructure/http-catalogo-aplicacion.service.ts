import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, of, throwError } from 'rxjs';
import { PARAMETROS_UI_OPTIONS } from '../../../../microfrontend/config';
import type { ParametrosUiResource } from '../../../../microfrontend/types';
import { handleApiError } from '../../../core/http/api-error';
import { EventStreamService } from '../../../core/realtime/event-stream.service';
import type { CatalogoAplicacion, SolicitudCatalogo } from '../domain/catalogo-aplicacion';
import type { CatalogoAmbiente, CatalogoEstadoToken, CatalogoToken, ConsultaCatalogoToken, CrearCatalogoToken } from '../domain/token-administration';

export interface CambioCatalogo { recurso: string; operacion: string; id: string; }

@Injectable({ providedIn: 'root' })
export class HttpCatalogoAplicacionService {
  private readonly http = inject(HttpClient);
  private readonly eventos = inject(EventStreamService);
  private readonly options = inject(PARAMETROS_UI_OPTIONS);
  private readonly url = `${this.options.apiBaseUrl}/aplicaciones/${encodeURIComponent(this.options.applicationId)}/administracion`;
  escuchar(): Observable<CambioCatalogo> {
    return new Observable<CambioCatalogo>(observer => {
      const subscription = this.eventos.connect<CambioCatalogo>(`${this.url}/events`, 'catalogo-aplicacion',
        conectado => observer.next({ recurso: 'conexion', operacion: conectado ? 'CONNECTED' : 'DISCONNECTED', id: '' }))
        .subscribe(observer);
      return () => subscription.unsubscribe();
    });
  }
  private manejar(error: HttpErrorResponse) {
    if (error.status === 401) {
      try { this.options.onAuthenticationRequired?.(); } catch { /* La UI mantiene el mensaje de sesión. */ }
    }
    return handleApiError(error);
  }
  consultar() {
    return this.http.get<{ catalogo: CatalogoAplicacion }>(this.url, { withCredentials: true }).pipe(
      map(response => {
        if (!response.catalogo || response.catalogo.aplicacion.id !== this.options.applicationId) {
          throw new Error('La respuesta no corresponde a la aplicación configurada.');
        }
        return response.catalogo;
      }), catchError((error: unknown) => error instanceof HttpErrorResponse ? this.manejar(error) : throwError(() => error)));
  }
  guardar(resource: ParametrosUiResource, data: SolicitudCatalogo, id?: string) {
    const url = `${this.url}/${resource}${id ? '/' + encodeURIComponent(id) : ''}`;
    return this.http.request<{ mensajes: string[] }>(id ? 'PUT' : 'POST', url,
      { body: data, withCredentials: true }).pipe(catchError((error: HttpErrorResponse) => this.manejar(error)));
  }
  eliminar(resource: ParametrosUiResource, id: string) {
    return this.http.delete<{ mensajes: string[] }>(`${this.url}/${resource}/${encodeURIComponent(id)}`,
      { withCredentials: true }).pipe(catchError((error: HttpErrorResponse) => this.manejar(error)));
  }
  tokens() {
    return this.http.get<{ tokens: CatalogoToken[] }>(`${this.options.apiBaseUrl}/tokens`, { withCredentials: true })
      .pipe(map(response => response.tokens.filter(token => token.aplicacionId === this.options.applicationId)),
        catchError((error: HttpErrorResponse) => this.manejar(error)));
  }
  estadosToken() {
    return this.http.get<{ estadosToken: CatalogoEstadoToken[] }>(`${this.options.apiBaseUrl}/estados-token`, { withCredentials: true })
      .pipe(map(response => response.estadosToken), catchError((error: HttpErrorResponse) => this.manejar(error)));
  }
  ambientes() {
    return this.http.get<{ ambientes: CatalogoAmbiente[] }>(`${this.options.apiBaseUrl}/ambientes?page=1&pageSize=10000`, { withCredentials: true })
      .pipe(map(response => response.ambientes), catchError((error: HttpErrorResponse) => this.manejar(error)));
  }
  crearToken(input: CrearCatalogoToken) {
    return this.http.post<{ mensajes: string[]; tokens: CatalogoToken[] }>(`${this.options.apiBaseUrl}/tokens`, input, { withCredentials: true })
      .pipe(catchError((error: HttpErrorResponse) => this.manejar(error)));
  }
  actualizarEstadoToken(id: string, estadoToken: string) {
    return this.http.patch<{ mensajes: string[]; tokens: CatalogoToken[] }>(`${this.options.apiBaseUrl}/tokens/${encodeURIComponent(id)}/estado`, { estadoToken }, { withCredentials: true })
      .pipe(catchError((error: HttpErrorResponse) => this.manejar(error)));
  }
  validarToken(id: string, token: string) {
    return this.http.post<{ valido: boolean }>(`${this.options.apiBaseUrl}/tokens/${encodeURIComponent(id)}/validar`, { token }, { withCredentials: true })
      .pipe(map(response => response.valido), catchError((error: HttpErrorResponse) => error.status === 401
        ? of(false) : this.manejar(error)));
  }
  consultarParametrosPorToken(id: string, token: string) {
    return this.http.get<ConsultaCatalogoToken>(`${this.options.apiBaseUrl}/tokens/${encodeURIComponent(id)}/parametros`, {
      headers: { Authorization: `Bearer ${token}` }, withCredentials: true
    }).pipe(catchError((error: HttpErrorResponse) => error.status === 401
      ? throwError(() => new Error('El token no es válido, está inactivo, revocado o expirado.')) : this.manejar(error)));
  }
}
