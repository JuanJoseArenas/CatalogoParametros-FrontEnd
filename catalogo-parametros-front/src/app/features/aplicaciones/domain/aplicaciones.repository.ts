import { Observable } from 'rxjs';
import { Aplicacion, AplicacionInput } from './aplicacion';
import { OperationResult } from '../../../shared/contracts/operation-result';
export abstract class AplicacionesRepository {
  abstract readonly eventsUrl: string;
  abstract findPage(page: number, pageSize: number): Observable<Aplicacion[]>;
  abstract findAll(): Observable<Aplicacion[]>;
  abstract create(input: AplicacionInput): Observable<OperationResult>;
  abstract update(id: string, input: AplicacionInput): Observable<OperationResult>;
  abstract delete(id: string): Observable<OperationResult>;
  abstract changeStatus(id: string, activa: boolean): Observable<OperationResult>;
}
