import { Observable } from 'rxjs';
import { Organizacion, OrganizacionInput } from './organizacion';
import { OperationResult } from '../../../shared/contracts/operation-result';

export abstract class OrganizacionesRepository {
  abstract readonly eventsUrl: string;
  abstract findPage(page: number, pageSize: number): Observable<Organizacion[]>;
  abstract findAll(): Observable<Organizacion[]>;
  abstract create(input: OrganizacionInput): Observable<OperationResult>;
  abstract update(id: string, input: OrganizacionInput): Observable<OperationResult>;
  abstract delete(id: string): Observable<OperationResult>;
}
