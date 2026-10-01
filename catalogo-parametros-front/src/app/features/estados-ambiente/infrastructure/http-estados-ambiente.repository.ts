import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { handleApiError } from '../../../core/http/api-error';
import { OperationResult } from '../../../shared/contracts/operation-result';
import { EstadoAmbiente, EstadoAmbienteInput } from '../domain/estado-ambiente';
import { EstadosAmbienteRepository } from '../domain/estados-ambiente.repository';

interface EstadoAmbienteResponse extends OperationResult { estadosAmbiente: EstadoAmbiente[]; }

@Injectable()
export class HttpEstadosAmbienteRepository implements EstadosAmbienteRepository {
  private readonly url = `${environment.apiUrl}/estados-ambiente`;
  readonly eventsUrl = `${this.url}/events`;

  constructor(private readonly http: HttpClient) {}

  findPage(page: number, pageSize: number): Observable<EstadoAmbiente[]> {
    return this.http.get<EstadoAmbienteResponse>(this.url, { params: { page, pageSize } })
      .pipe(map(response => response.estadosAmbiente), catchError(handleApiError));
  }

  findById(id: string): Observable<EstadoAmbiente> {
    return this.http.get<EstadoAmbienteResponse>(`${this.url}/${id}`).pipe(
      map(response => {
        const estadoAmbiente = response.estadosAmbiente[0];
        if (!estadoAmbiente) throw new Error('No se encontró el estado de ambiente.');
        return estadoAmbiente;
      }),
      catchError(handleApiError)
    );
  }

  create(input: EstadoAmbienteInput): Observable<OperationResult> {
    return this.http.post<OperationResult>(this.url, input).pipe(catchError(handleApiError));
  }

  update(id: string, input: EstadoAmbienteInput): Observable<OperationResult> {
    return this.http.put<OperationResult>(`${this.url}/${id}`, input).pipe(catchError(handleApiError));
  }

  delete(id: string): Observable<OperationResult> {
    return this.http.delete<OperationResult>(`${this.url}/${id}`).pipe(catchError(handleApiError));
  }
}

