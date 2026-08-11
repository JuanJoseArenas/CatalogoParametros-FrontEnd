import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map, timeout } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  Organizacion,
  OrganizacionResponse,
  Aplicacion,
  AplicacionResponse,
  Modulo,
  ModuloResponse,
  Funcionalidad,
  FuncionalidadResponse,
  Parametro,
  ParametroResponse
} from '../../shared/models';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Organizaciones
  getOrganizaciones(): Observable<Organizacion[]> {
    return this.http.get<OrganizacionResponse>(`${this.baseUrl}/organizaciones`).pipe(
      map(response => response.organizaciones),
      catchError(this.handleError)
    );
  }

  getOrganizacionById(id: string): Observable<Organizacion[]> {
    return this.http.get<OrganizacionResponse>(`${this.baseUrl}/organizaciones/${id}`).pipe(
      map(response => response.organizaciones),
      catchError(this.handleError)
    );
  }

  createOrganizacion(organizacion: { nombre: string }): Observable<OrganizacionResponse> {
    return this.http.post<OrganizacionResponse>(`${this.baseUrl}/organizaciones`, organizacion).pipe(
      catchError(this.handleError)
    );
  }

  updateOrganizacion(id: string, organizacion: { nombre: string }): Observable<OrganizacionResponse> {
    return this.http.put<OrganizacionResponse>(`${this.baseUrl}/organizaciones/${id}`, organizacion).pipe(
      catchError(this.handleError)
    );
  }

  deleteOrganizacion(id: string): Observable<OrganizacionResponse> {
    return this.http.delete<OrganizacionResponse>(`${this.baseUrl}/organizaciones/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  // Aplicaciones
  getAplicaciones(): Observable<Aplicacion[]> {
    return this.http.get<AplicacionResponse>(`${this.baseUrl}/aplicaciones`).pipe(
      map(response => response.aplicaciones),
      catchError(this.handleError)
    );
  }

  createAplicacion(aplicacion: { nombre: string; idOrganizacion: string; activa?: boolean; fechaInicio?: string; fechaFinal?: string }): Observable<AplicacionResponse> {
    return this.http.post<AplicacionResponse>(`${this.baseUrl}/aplicaciones`, aplicacion).pipe(
      catchError(this.handleError)
    );
  }

  // Modulos
  getModulos(): Observable<Modulo[]> {
    return this.http.get<ModuloResponse>(`${this.baseUrl}/modulos`).pipe(
      map(response => response.modulos),
      catchError(this.handleError)
    );
  }

  createModulo(modulo: { nombre: string; idAplicacion: string; activo?: boolean; fechaInicio?: string; fechaFinal?: string }): Observable<ModuloResponse> {
    return this.http.post<ModuloResponse>(`${this.baseUrl}/modulos`, modulo).pipe(
      catchError(this.handleError)
    );
  }

  // Funcionalidades
  getFuncionalidades(): Observable<Funcionalidad[]> {
    return this.http.get<FuncionalidadResponse>(`${this.baseUrl}/funcionalidades`).pipe(
      map(response => response.funcionalidades),
      catchError(this.handleError)
    );
  }

  getFuncionalidadById(id: string): Observable<Funcionalidad[]> {
    return this.http.get<FuncionalidadResponse>(`${this.baseUrl}/funcionalidades/${id}`).pipe(
      map(response => response.funcionalidades),
      catchError(this.handleError)
    );
  }

  createFuncionalidad(funcionalidad: { nombre: string; idModulo: string; activo?: boolean; fechaInicio?: string; fechaFinal?: string }): Observable<ParametroResponse> {
    return this.http.post<ParametroResponse>(`${this.baseUrl}/funcionalidades`, funcionalidad).pipe(
      catchError(this.handleError)
    );
  }

  updateFuncionalidad(id: string, funcionalidad: { nombre: string; idModulo: string; activo?: boolean; fechaInicio?: string; fechaFinal?: string }): Observable<ParametroResponse> {
    return this.http.put<ParametroResponse>(`${this.baseUrl}/funcionalidades/${id}`, funcionalidad).pipe(
      catchError(this.handleError)
    );
  }

  deleteFuncionalidad(id: string): Observable<ParametroResponse> {
    return this.http.delete<ParametroResponse>(`${this.baseUrl}/funcionalidades/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  // Parametros
  getParametros(): Observable<Parametro[]> {
    return this.http.get<ParametroResponse>(`${this.baseUrl}/parametros`).pipe(
      map(response => response.parametros),
      catchError(this.handleError)
    );
  }

  getParametroById(id: string): Observable<Parametro[]> {
    return this.http.get<ParametroResponse>(`${this.baseUrl}/parametros/${id}`).pipe(
      map(response => response.parametros),
      catchError(this.handleError)
    );
  }

  createParametro(parametro: { nombre: string; idFuncionalidad: string; idTipoParametro: string; activo?: boolean }): Observable<ParametroResponse> {
    return this.http.post<ParametroResponse>(`${this.baseUrl}/parametros`, parametro).pipe(
      catchError(this.handleError)
    );
  }

  updateParametro(id: string, parametro: { nombre: string; idFuncionalidad: string; idTipoParametro: string; activo?: boolean }): Observable<ParametroResponse> {
    return this.http.put<ParametroResponse>(`${this.baseUrl}/parametros/${id}`, parametro).pipe(
      catchError(this.handleError)
    );
  }

  deleteParametro(id: string): Observable<ParametroResponse> {
    return this.http.delete<ParametroResponse>(`${this.baseUrl}/parametros/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: any): Observable<never> {
    console.error('API Error:', error);

    let errorMessage = 'Error en la comunicacion con el servidor';

    if (error.status === 0) {
      errorMessage = 'No se pudo conectar con el servidor. Verifica que el backend este corriendo en http://localhost:8080';
    } else if (error.status === 404) {
      errorMessage = 'Recurso no encontrado';
    } else if (error.status === 400) {
      errorMessage = error.error?.mensajes?.[0] || 'Solicitud incorrecta';
    } else if (error.status === 500) {
      errorMessage = 'Error interno del servidor';
    } else if (error.message) {
      errorMessage = error.message;
    }

    return throwError(() => new Error(errorMessage));
  }
}
