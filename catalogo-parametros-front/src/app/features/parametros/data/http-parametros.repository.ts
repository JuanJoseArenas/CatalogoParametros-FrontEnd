import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { handleApiError } from '../../../core/http/api-error';
import { Parametro, ParametroInput, TipoParametro } from '../domain/parametro';
import { ParametrosRepository } from '../domain/parametros.repository';
import { OperationResult } from '../../../shared/contracts/operation-result';
interface Response { mensajes: string[]; parametros: Parametro[]; }
interface TypesResponse { mensajes: string[]; tiposParametro: TipoParametro[]; }
@Injectable()
export class HttpParametrosRepository implements ParametrosRepository {
  private readonly url = `${environment.apiUrl}/parametros`; readonly eventsUrl = `${this.url}/events`;
  constructor(private readonly http: HttpClient) {}
  findPage(page = 1, pageSize = 10): Observable<Parametro[]> { return this.http.get<Response>(this.url, { params: { page, pageSize } }).pipe(map(r => r.parametros), catchError(handleApiError)); }
  findAll(): Observable<Parametro[]> { return this.findPage(1, 10000); }
  findTypes(): Observable<TipoParametro[]> { return this.http.get<TypesResponse>(`${environment.apiUrl}/tipos-parametro`).pipe(map(r => r.tiposParametro), catchError(handleApiError)); }
  create(input: ParametroInput): Observable<OperationResult> { return this.http.post<OperationResult>(this.url, input).pipe(catchError(handleApiError)); }
  update(id: string, input: ParametroInput): Observable<OperationResult> { return this.http.put<OperationResult>(`${this.url}/${id}`, input).pipe(catchError(handleApiError)); }
  delete(id: string): Observable<OperationResult> { return this.http.delete<OperationResult>(`${this.url}/${id}`).pipe(catchError(handleApiError)); }
  changeStatus(id: string, activo: boolean): Observable<OperationResult> { return this.http.post<OperationResult>(`${this.url}/${id}/cambiarestado`, { activo }).pipe(catchError(handleApiError)); }
}
