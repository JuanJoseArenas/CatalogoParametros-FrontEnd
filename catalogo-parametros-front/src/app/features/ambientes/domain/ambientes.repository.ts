import { Observable } from 'rxjs';
import { Ambiente } from './ambiente';

export abstract class AmbientesRepository {
  abstract findPage(page: number, pageSize: number): Observable<Ambiente[]>;
  abstract findById(id: string): Observable<Ambiente>;
}

