import { Observable } from 'rxjs';
import { Funcionalidad, FuncionalidadInput } from './funcionalidad';
import { OperationResult } from '../../../shared/contracts/operation-result';
export abstract class FuncionalidadesRepository {
  abstract readonly eventsUrl: string;
  abstract findPage(page: number, pageSize: number): Observable<Funcionalidad[]>;
  abstract findAll(): Observable<Funcionalidad[]>;
  abstract create(input: FuncionalidadInput): Observable<OperationResult>;
  abstract update(id: string, input: FuncionalidadInput): Observable<OperationResult>;
  abstract delete(id: string): Observable<OperationResult>;
  abstract changeStatus(id: string, activo: boolean): Observable<OperationResult>;
}
