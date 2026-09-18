import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { handleApiError } from '../../../core/http/api-error';
import { Funcionalidad, FuncionalidadInput } from '../domain/funcionalidad';
import { FuncionalidadesRepository } from '../domain/funcionalidades.repository';
import { OperationResult } from '../../../shared/contracts/operation-result';
interface Response { mensajes: string[]; funcionalidades: Funcionalidad[]; }
@Injectable()
export class HttpFuncionalidadesRepository implements FuncionalidadesRepository {
  private readonly url = `${environment.apiUrl}/funcionalidades`; readonly eventsUrl = `${this.url}/events`;
  constructor(private readonly http: HttpClient) {}
  findPage(page = 1, pageSize = 10): Observable<Funcionalidad[]> { return this.http.get<Response>(this.url, { params: { page, pageSize } }).pipe(map(r => r.funcionalidades), catchError(handleApiError)); }
  findAll(): Observable<Funcionalidad[]> { return this.findPage(1, 10000); }
  create(input: FuncionalidadInput): Observable<OperationResult> { return this.http.post<OperationResult>(this.url, input).pipe(catchError(handleApiError)); }
  update(id: string, input: FuncionalidadInput): Observable<OperationResult> { return this.http.put<OperationResult>(`${this.url}/${id}`, input).pipe(catchError(handleApiError)); }
  delete(id: string): Observable<OperationResult> { return this.http.delete<OperationResult>(`${this.url}/${id}`).pipe(catchError(handleApiError)); }
  changeStatus(id: string, activo: boolean): Observable<OperationResult> { return this.http.post<OperationResult>(`${this.url}/${id}/cambiarestado`, { activo }).pipe(catchError(handleApiError)); }
}
