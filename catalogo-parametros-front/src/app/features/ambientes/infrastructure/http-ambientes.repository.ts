import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { handleApiError } from '../../../core/http/api-error';
import { OperationResult } from '../../../shared/contracts/operation-result';
import { Ambiente, AmbienteInput } from '../domain/ambiente';
import { AmbientesRepository } from '../domain/ambientes.repository';

interface AmbienteResponse extends OperationResult { ambientes: Ambiente[]; }

@Injectable()
export class HttpAmbientesRepository implements AmbientesRepository {
  private readonly url = `${environment.apiUrl}/ambientes`;
  readonly eventsUrl = `${this.url}/events`;

  constructor(private readonly http: HttpClient) {}

  findPage(page: number, pageSize: number): Observable<Ambiente[]> {
    return this.http.get<AmbienteResponse>(this.url, { params: { page, pageSize } })
      .pipe(map(response => response.ambientes), catchError(handleApiError));
  }

  findById(id: string): Observable<Ambiente> {
    return this.http.get<AmbienteResponse>(`${this.url}/${id}`).pipe(
      map(response => {
        const ambiente = response.ambientes[0];
        if (!ambiente) throw new Error('No se encontró el ambiente.');
        return ambiente;
      }),
      catchError(handleApiError)
    );
  }

  create(input: AmbienteInput): Observable<OperationResult> {
    return this.http.post<OperationResult>(this.url, input).pipe(catchError(handleApiError));
  }

  update(id: string, input: AmbienteInput): Observable<OperationResult> {
    return this.http.put<OperationResult>(`${this.url}/${id}`, input).pipe(catchError(handleApiError));
  }

  delete(id: string): Observable<OperationResult> {
    return this.http.delete<OperationResult>(`${this.url}/${id}`).pipe(catchError(handleApiError));
  }
}

