import { Observable } from 'rxjs';
import { Metadato, MetadatoInput, TipoMetadato } from './metadato';
import { OperationResult } from '../../../shared/contracts/operation-result';
export abstract class MetadatosRepository {
  abstract readonly eventsUrl: string;
  abstract findAll(idParametro?: string): Observable<Metadato[]>;
  abstract findTypes(): Observable<TipoMetadato[]>;
  abstract create(input: MetadatoInput): Observable<OperationResult>;
  abstract update(id: string, input: MetadatoInput): Observable<OperationResult>;
  abstract delete(id: string): Observable<OperationResult>;
}
