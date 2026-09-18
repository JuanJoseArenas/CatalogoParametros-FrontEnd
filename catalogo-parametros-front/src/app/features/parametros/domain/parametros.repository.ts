import { Observable } from 'rxjs';
import { Parametro, ParametroInput, TipoParametro } from './parametro';
import { OperationResult } from '../../../shared/contracts/operation-result';
export abstract class ParametrosRepository {
  abstract readonly eventsUrl: string;
  abstract findPage(page: number, pageSize: number): Observable<Parametro[]>;
  abstract findAll(): Observable<Parametro[]>;
  abstract findTypes(): Observable<TipoParametro[]>;
  abstract create(input: ParametroInput): Observable<OperationResult>;
  abstract update(id: string, input: ParametroInput): Observable<OperationResult>;
  abstract delete(id: string): Observable<OperationResult>;
  abstract changeStatus(id: string, activo: boolean): Observable<OperationResult>;
}
