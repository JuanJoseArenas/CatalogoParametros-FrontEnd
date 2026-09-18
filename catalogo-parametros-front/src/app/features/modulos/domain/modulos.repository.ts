import { Observable } from 'rxjs';
import { Modulo, ModuloInput } from './modulo';
import { OperationResult } from '../../../shared/contracts/operation-result';
export abstract class ModulosRepository {
  abstract readonly eventsUrl: string;
  abstract findPage(page: number, pageSize: number): Observable<Modulo[]>;
  abstract findAll(): Observable<Modulo[]>;
  abstract create(input: ModuloInput): Observable<OperationResult>;
  abstract update(id: string, input: ModuloInput): Observable<OperationResult>;
  abstract delete(id: string): Observable<OperationResult>;
  abstract changeStatus(id: string, activo: boolean): Observable<OperationResult>;
}
