import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { handleApiError } from '../../../core/http/api-error';
import { Metadato, MetadatoInput, TipoMetadato } from '../domain/metadato';
import { MetadatosRepository } from '../domain/metadatos.repository';
import { OperationResult } from '../../../shared/contracts/operation-result';
interface Response { mensajes: string[]; metadatos: Metadato[]; }
interface TypesResponse { mensajes: string[]; tiposMetadato: TipoMetadato[]; }
@Injectable()
export class HttpMetadatosRepository implements MetadatosRepository {
  private readonly url = `${environment.apiUrl}/metadatos`; readonly eventsUrl = `${this.url}/events`;
  constructor(private readonly http: HttpClient) {}
  findAll(idParametro?: string): Observable<Metadato[]> { const params: Record<string, string> = {}; if (idParametro) params['idParametro'] = idParametro; return this.http.get<Response>(this.url, { params }).pipe(map(r => r.metadatos), catchError(handleApiError)); }
  findTypes(): Observable<TipoMetadato[]> { return this.http.get<TypesResponse>(`${environment.apiUrl}/tipos-metadato`).pipe(map(r => r.tiposMetadato), catchError(handleApiError)); }
  create(input: MetadatoInput): Observable<OperationResult> { return this.http.post<OperationResult>(this.url, input).pipe(catchError(handleApiError)); }
  update(id: string, input: MetadatoInput): Observable<OperationResult> { return this.http.put<OperationResult>(`${this.url}/${id}`, input).pipe(catchError(handleApiError)); }
  delete(id: string): Observable<OperationResult> { return this.http.delete<OperationResult>(`${this.url}/${id}`).pipe(catchError(handleApiError)); }
}
