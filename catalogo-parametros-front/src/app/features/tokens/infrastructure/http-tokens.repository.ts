import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, map, of, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { handleApiError } from '../../../core/http/api-error';
import { OperationResult } from '../../../shared/contracts/operation-result';
import { ParametrosTokenResponse } from '../domain/parametros-token';
import { CrearTokenInput, EstadoToken, Token } from '../domain/token';
interface TokenResponse extends OperationResult { tokens: Token[]; }
@Injectable()
export class HttpTokensRepository {
  private readonly url = `${environment.apiUrl}/tokens`;
  constructor(private readonly http: HttpClient) {}
  findAll() { return this.http.get<TokenResponse>(this.url).pipe(map(r => r.tokens), catchError(handleApiError)); }
  findById(id: string) { return this.http.get<TokenResponse>(`${this.url}/${encodeURIComponent(id)}`).pipe(map(r => {
    if (!r.tokens[0]) throw new Error('No se encontró el token.');
    return r.tokens[0];
  }), catchError(handleApiError)); }
  findStates() { return this.http.get<{ estadosToken: EstadoToken[] }>(`${environment.apiUrl}/estados-token`).pipe(map(r => r.estadosToken), catchError(handleApiError)); }
  findState(id: string) { return this.http.get<{ estadosToken: EstadoToken[] }>(`${environment.apiUrl}/estados-token/${encodeURIComponent(id)}`).pipe(map(r => r.estadosToken), catchError(handleApiError)); }
  create(input: CrearTokenInput) { return this.http.post<TokenResponse>(this.url, input).pipe(catchError(handleApiError)); }
  changeState(id: string, estadoToken: string) { return this.http.patch<TokenResponse>(`${this.url}/${encodeURIComponent(id)}/estado`, { estadoToken }).pipe(catchError(handleApiError)); }
  validate(id: string, token: string) { return this.http.post<{ valido: boolean }>(`${this.url}/${encodeURIComponent(id)}/validar`, { token }).pipe(map(r => r.valido), catchError((error: HttpErrorResponse) => error.status === 401 ? of(false) : handleApiError(error))); }
  findParameters(id: string, token: string) { return this.http.get<ParametrosTokenResponse>(`${this.url}/${encodeURIComponent(id)}/parametros`, { headers: { Authorization: `Bearer ${token}` } }).pipe(catchError((error: HttpErrorResponse) => error.status === 401 ? throwError(() => new Error('El token no es válido, está inactivo, revocado o expirado.')) : handleApiError(error))); }
}
