import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { handleApiError } from '../../../core/http/api-error';
import { Modulo, ModuloInput } from '../domain/modulo';
import { ModulosRepository } from '../domain/modulos.repository';
import { OperationResult } from '../../../shared/contracts/operation-result';
interface Response { mensajes: string[]; modulos: Modulo[]; }
@Injectable()
export class HttpModulosRepository implements ModulosRepository {
  private readonly url = `${environment.apiUrl}/modulos`; readonly eventsUrl = `${this.url}/events`;
  constructor(private readonly http: HttpClient) {}
  findPage(page = 1, pageSize = 10): Observable<Modulo[]> { return this.http.get<Response>(this.url, { params: { page, pageSize } }).pipe(map(r => r.modulos), catchError(handleApiError)); }
  findAll(): Observable<Modulo[]> { return this.findPage(1, 10000); }
  create(input: ModuloInput): Observable<OperationResult> { return this.http.post<OperationResult>(this.url, input).pipe(catchError(handleApiError)); }
  update(id: string, input: ModuloInput): Observable<OperationResult> { return this.http.put<OperationResult>(`${this.url}/${id}`, input).pipe(catchError(handleApiError)); }
  delete(id: string): Observable<OperationResult> { return this.http.delete<OperationResult>(`${this.url}/${id}`).pipe(catchError(handleApiError)); }
  changeStatus(id: string, activo: boolean): Observable<OperationResult> { return this.http.post<OperationResult>(`${this.url}/${id}/cambiarestado`, { activo }).pipe(catchError(handleApiError)); }
}
