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
  ParametroResponse,
  TipoParametro,
  TipoParametroResponse,
  TipoMetadato,
  TipoMetadatoResponse,
  Metadato,
  MetadatoResponse
} from '../../shared/models';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = environment.apiUrl;
  private static readonly ALL_PAGE_SIZE = 10000;

  constructor(private http: HttpClient) {}

  getBaseUrl(): string {
    return this.baseUrl;
  }

  // Organizaciones
  getOrganizaciones(page: number = 1, pageSize: number = 10): Observable<Organizacion[]> {
    return this.http.get<OrganizacionResponse>(`${this.baseUrl}/organizaciones`, {
      params: { page: page.toString(), pageSize: pageSize.toString() }
    }).pipe(
      map(response => response.organizaciones),
      catchError(this.handleError)
    );
  }

  getAllOrganizaciones(): Observable<Organizacion[]> {
    return this.http.get<OrganizacionResponse>(`${this.baseUrl}/organizaciones`, {
      params: { page: '1', pageSize: ApiService.ALL_PAGE_SIZE.toString() }
    }).pipe(
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

  createOrganizacion(organizacion: { nombre: string; fechaInicio?: string; fechaFinal?: string }): Observable<OrganizacionResponse> {
    return this.http.post<OrganizacionResponse>(`${this.baseUrl}/organizaciones`, organizacion).pipe(
      catchError(this.handleError)
    );
  }

  updateOrganizacion(id: string, organizacion: { nombre: string; fechaInicio?: string; fechaFinal?: string }): Observable<OrganizacionResponse> {
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
  getAplicaciones(page: number = 1, pageSize: number = 10): Observable<Aplicacion[]> {
    return this.http.get<AplicacionResponse>(`${this.baseUrl}/aplicaciones`, {
      params: { page: page.toString(), pageSize: pageSize.toString() }
    }).pipe(
      map(response => response.aplicaciones),
      catchError(this.handleError)
    );
  }

  getAllAplicaciones(): Observable<Aplicacion[]> {
    return this.http.get<AplicacionResponse>(`${this.baseUrl}/aplicaciones`, {
      params: { page: '1', pageSize: ApiService.ALL_PAGE_SIZE.toString() }
    }).pipe(
      map(response => response.aplicaciones),
      catchError(this.handleError)
    );
  }

  createAplicacion(aplicacion: { nombre: string; idOrganizacion: string; activa?: boolean; fechaInicio?: string; fechaFinal?: string }): Observable<AplicacionResponse> {
    return this.http.post<AplicacionResponse>(`${this.baseUrl}/aplicaciones`, aplicacion).pipe(
      catchError(this.handleError)
    );
  }

  updateAplicacion(id: string, aplicacion: { nombre: string; idOrganizacion: string; activa?: boolean; fechaInicio?: string; fechaFinal?: string }): Observable<AplicacionResponse> {
    return this.http.put<AplicacionResponse>(`${this.baseUrl}/aplicaciones/${id}`, aplicacion).pipe(
      catchError(this.handleError)
    );
  }

  deleteAplicacion(id: string): Observable<AplicacionResponse> {
    return this.http.delete<AplicacionResponse>(`${this.baseUrl}/aplicaciones/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  // Modulos
  getModulos(page: number = 1, pageSize: number = 10): Observable<Modulo[]> {
    return this.http.get<ModuloResponse>(`${this.baseUrl}/modulos`, {
      params: { page: page.toString(), pageSize: pageSize.toString() }
    }).pipe(
      map(response => response.modulos),
      catchError(this.handleError)
    );
  }

  getAllModulos(): Observable<Modulo[]> {
    return this.http.get<ModuloResponse>(`${this.baseUrl}/modulos`, {
      params: { page: '1', pageSize: ApiService.ALL_PAGE_SIZE.toString() }
    }).pipe(
      map(response => response.modulos),
      catchError(this.handleError)
    );
  }

  createModulo(modulo: { nombre: string; idAplicacion: string; activo?: boolean; fechaInicio?: string; fechaFinal?: string }): Observable<ModuloResponse> {
    return this.http.post<ModuloResponse>(`${this.baseUrl}/modulos`, modulo).pipe(
      catchError(this.handleError)
    );
  }

  updateModulo(id: string, modulo: { nombre: string; idAplicacion: string; activo?: boolean; fechaInicio?: string; fechaFinal?: string }): Observable<ModuloResponse> {
    return this.http.put<ModuloResponse>(`${this.baseUrl}/modulos/${id}`, modulo).pipe(
      catchError(this.handleError)
    );
  }

  deleteModulo(id: string): Observable<ModuloResponse> {
    return this.http.delete<ModuloResponse>(`${this.baseUrl}/modulos/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  // Funcionalidades
  getFuncionalidades(page: number = 1, pageSize: number = 10): Observable<Funcionalidad[]> {
    return this.http.get<FuncionalidadResponse>(`${this.baseUrl}/funcionalidades`, {
      params: { page: page.toString(), pageSize: pageSize.toString() }
    }).pipe(
      map(response => response.funcionalidades),
      catchError(this.handleError)
    );
  }

  getAllFuncionalidades(): Observable<Funcionalidad[]> {
    return this.http.get<FuncionalidadResponse>(`${this.baseUrl}/funcionalidades`, {
      params: { page: '1', pageSize: ApiService.ALL_PAGE_SIZE.toString() }
    }).pipe(
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
  getParametros(page: number = 1, pageSize: number = 10): Observable<Parametro[]> {
    return this.http.get<ParametroResponse>(`${this.baseUrl}/parametros`, {
      params: { page: page.toString(), pageSize: pageSize.toString() }
    }).pipe(
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

  getTiposParametro(): Observable<TipoParametro[]> {
    return this.http.get<TipoParametroResponse>(`${this.baseUrl}/tipos-parametro`).pipe(
      map(response => response.tiposParametro),
      catchError(this.handleError)
    );
  }

  getAllParametros(): Observable<Parametro[]> {
    return this.http.get<ParametroResponse>(`${this.baseUrl}/parametros`, {
      params: { page: '1', pageSize: ApiService.ALL_PAGE_SIZE.toString() }
    }).pipe(
      map(response => response.parametros),
      catchError(this.handleError)
    );
  }

  // Tipos de metadato
  getTiposMetadato(): Observable<TipoMetadato[]> {
    return this.http.get<TipoMetadatoResponse>(`${this.baseUrl}/tipos-metadato`).pipe(
      map(response => response.tiposMetadato),
      catchError(this.handleError)
    );
  }

  // Metadatos
  getMetadatos(idParametro?: string): Observable<Metadato[]> {
    const params: Record<string, string> = {};
    if (idParametro) params['idParametro'] = idParametro;

    return this.http.get<MetadatoResponse>(`${this.baseUrl}/metadatos`, { params }).pipe(
      map(response => response.metadatos),
      catchError(this.handleError)
    );
  }

  createMetadato(metadato: { idParametro: string; idTipoMetadato: string; valor: string }): Observable<MetadatoResponse> {
    return this.http.post<MetadatoResponse>(`${this.baseUrl}/metadatos`, metadato).pipe(
      catchError(this.handleError)
    );
  }

  updateMetadato(id: string, metadato: { idParametro: string; idTipoMetadato: string; valor: string }): Observable<MetadatoResponse> {
    return this.http.put<MetadatoResponse>(`${this.baseUrl}/metadatos/${id}`, metadato).pipe(
      catchError(this.handleError)
    );
  }

  deleteMetadato(id: string): Observable<MetadatoResponse> {
    return this.http.delete<MetadatoResponse>(`${this.baseUrl}/metadatos/${id}`).pipe(
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
    } else if (error.status === 400 || error.status === 409) {
      errorMessage = error.error?.mensajes?.[0] || (error.status === 409 ? 'Conflicto: el recurso ya existe' : 'Solicitud incorrecta');
    } else if (error.status === 500) {
      errorMessage = 'Error interno del servidor';
    } else if (error.message) {
      errorMessage = error.message;
    }

    return throwError(() => new Error(errorMessage));
  }
}
