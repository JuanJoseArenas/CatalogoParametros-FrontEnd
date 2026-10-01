import { Observable } from 'rxjs';
import { OperationResult } from '../../../shared/contracts/operation-result';
import { Ambiente, AmbienteInput } from './ambiente';

export abstract class AmbientesRepository {
  abstract readonly eventsUrl: string;
  abstract findPage(page: number, pageSize: number): Observable<Ambiente[]>;
  abstract findById(id: string): Observable<Ambiente>;
  abstract create(input: AmbienteInput): Observable<OperationResult>;
  abstract update(id: string, input: AmbienteInput): Observable<OperationResult>;
  abstract delete(id: string): Observable<OperationResult>;
}

