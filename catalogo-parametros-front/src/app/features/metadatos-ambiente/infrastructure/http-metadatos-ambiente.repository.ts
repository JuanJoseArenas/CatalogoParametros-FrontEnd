import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { handleApiError } from '../../../core/http/api-error';
import { OperationResult } from '../../../shared/contracts/operation-result';
import { MetadatoAmbiente, MetadatoAmbienteInput } from '../domain/metadato-ambiente';
import { MetadatosAmbienteRepository } from '../domain/metadatos-ambiente.repository';

interface MetadatoAmbienteResponse extends OperationResult { metadatosAmbiente: MetadatoAmbiente[]; }

@Injectable()
export class HttpMetadatosAmbienteRepository implements MetadatosAmbienteRepository {
  private readonly url = `${environment.apiUrl}/metadatos-ambiente`;
  readonly eventsUrl = `${this.url}/events`;
  constructor(private readonly http: HttpClient) {}

  findPage(page: number, pageSize: number): Observable<MetadatoAmbiente[]> {
    return this.http.get<MetadatoAmbienteResponse>(this.url, { params: { page, pageSize } })
      .pipe(map(response => response.metadatosAmbiente), catchError(handleApiError));
  }
  findById(id: string): Observable<MetadatoAmbiente> {
    return this.http.get<MetadatoAmbienteResponse>(`${this.url}/${id}`).pipe(
      map(response => {
        const metadato = response.metadatosAmbiente[0];
        if (!metadato) throw new Error('No se encontró el metadato de ambiente.');
        return metadato;
      }), catchError(handleApiError)
    );
  }
  create(input: MetadatoAmbienteInput): Observable<OperationResult> {
    return this.http.post<OperationResult>(this.url, input).pipe(catchError(handleApiError));
  }
  update(id: string, input: MetadatoAmbienteInput): Observable<OperationResult> {
    return this.http.put<OperationResult>(`${this.url}/${id}`, input).pipe(catchError(handleApiError));
  }
  delete(id: string): Observable<OperationResult> {
    return this.http.delete<OperationResult>(`${this.url}/${id}`).pipe(catchError(handleApiError));
  }
}

