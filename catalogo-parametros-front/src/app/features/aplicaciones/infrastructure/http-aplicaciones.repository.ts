import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { handleApiError } from '../../../core/http/api-error';
import { Aplicacion, AplicacionInput } from '../domain/aplicacion';
import { AplicacionesRepository } from '../domain/aplicaciones.repository';
import { OperationResult } from '../../../shared/contracts/operation-result';
interface Response { mensajes: string[]; aplicaciones: Aplicacion[]; }
@Injectable()
export class HttpAplicacionesRepository implements AplicacionesRepository {
  private readonly url = `${environment.apiUrl}/aplicaciones`; readonly eventsUrl = `${this.url}/events`;
  constructor(private readonly http: HttpClient) {}
  findPage(page = 1, pageSize = 10): Observable<Aplicacion[]> { return this.http.get<Response>(this.url, { params: { page, pageSize } }).pipe(map(r => r.aplicaciones), catchError(handleApiError)); }
  findAll(): Observable<Aplicacion[]> { return this.findPage(1, 10000); }
  create(input: AplicacionInput): Observable<OperationResult> { return this.http.post<OperationResult>(this.url, input).pipe(catchError(handleApiError)); }
  update(id: string, input: AplicacionInput): Observable<OperationResult> { return this.http.put<OperationResult>(`${this.url}/${id}`, input).pipe(catchError(handleApiError)); }
  delete(id: string): Observable<OperationResult> { return this.http.delete<OperationResult>(`${this.url}/${id}`).pipe(catchError(handleApiError)); }
  changeStatus(id: string, activa: boolean): Observable<OperationResult> { return this.http.post<OperationResult>(`${this.url}/${id}/cambiarestado`, { activo: activa }).pipe(catchError(handleApiError)); }
}
