import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { handleApiError } from '../../../core/http/api-error';
import { OperationResult } from '../../../shared/contracts/operation-result';
import { EstadoMetadatoAmbiente } from '../domain/estado-metadato-ambiente';
import { EstadosMetadatoAmbienteRepository } from '../domain/estados-metadato-ambiente.repository';

interface EstadoMetadatoAmbienteResponse extends OperationResult { estadosMetadatoAmbiente: EstadoMetadatoAmbiente[]; }

@Injectable()
export class HttpEstadosMetadatoAmbienteRepository implements EstadosMetadatoAmbienteRepository {
  private readonly url = `${environment.apiUrl}/estados-metadato-ambiente`;

  constructor(private readonly http: HttpClient) {}

  findPage(page: number, pageSize: number): Observable<EstadoMetadatoAmbiente[]> {
    return this.http.get<EstadoMetadatoAmbienteResponse>(this.url, { params: { page, pageSize } })
      .pipe(map(response => response.estadosMetadatoAmbiente), catchError(handleApiError));
  }

  findById(id: string): Observable<EstadoMetadatoAmbiente> {
    return this.http.get<EstadoMetadatoAmbienteResponse>(`${this.url}/${id}`).pipe(
      map(response => {
        const estadoMetadatoAmbiente = response.estadosMetadatoAmbiente[0];
        if (!estadoMetadatoAmbiente) throw new Error('No se encontró el estado de metadato por ambiente.');
        return estadoMetadatoAmbiente;
      }),
      catchError(handleApiError)
    );
  }

}

