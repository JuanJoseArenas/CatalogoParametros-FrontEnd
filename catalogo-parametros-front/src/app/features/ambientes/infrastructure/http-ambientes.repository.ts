import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { handleApiError } from '../../../core/http/api-error';
import { Ambiente } from '../domain/ambiente';
import { AmbientesRepository } from '../domain/ambientes.repository';
import { OperationResult } from '../../../shared/contracts/operation-result';

interface AmbienteResponse extends OperationResult { ambientes: Ambiente[]; }

@Injectable()
export class HttpAmbientesRepository implements AmbientesRepository {
  private readonly url = `${environment.apiUrl}/ambientes`;

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

}

