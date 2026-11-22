import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { handleApiError } from '../../../core/http/api-error';
import { OperationResult } from '../../../shared/contracts/operation-result';
import { IdentidadServicio, IdentidadServicioInput } from '../domain/identidad-servicio';
import { IdentidadesServicioRepository } from '../domain/identidades-servicio.repository';

interface Response extends OperationResult { identidadesServicio: IdentidadServicio[]; }

@Injectable()
export class HttpIdentidadesServicioRepository implements IdentidadesServicioRepository {
  constructor(private readonly http: HttpClient) {}

  private url(idAplicacion: string): string {
    return `${environment.apiUrl}/aplicaciones/${idAplicacion}/identidades-servicio`;
  }

  findByAplicacion(idAplicacion: string): Observable<IdentidadServicio[]> {
    return this.http.get<Response>(this.url(idAplicacion)).pipe(
      map(response => response.identidadesServicio || []), catchError(handleApiError));
  }

  register(idAplicacion: string, input: IdentidadServicioInput): Observable<OperationResult> {
    return this.http.post<OperationResult>(this.url(idAplicacion), input).pipe(catchError(handleApiError));
  }

  remove(idAplicacion: string, clientId: string): Observable<OperationResult> {
    return this.http.delete<OperationResult>(`${this.url(idAplicacion)}/${encodeURIComponent(clientId)}`)
      .pipe(catchError(handleApiError));
  }
}
