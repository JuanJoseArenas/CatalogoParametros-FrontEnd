import { Observable } from 'rxjs';
import { OperationResult } from '../../../shared/contracts/operation-result';
import { MetadatoAmbiente, MetadatoAmbienteInput } from './metadato-ambiente';

export abstract class MetadatosAmbienteRepository {
  abstract readonly eventsUrl: string;
  abstract findPage(page: number, pageSize: number): Observable<MetadatoAmbiente[]>;
  abstract findById(id: string): Observable<MetadatoAmbiente>;
  abstract create(input: MetadatoAmbienteInput): Observable<OperationResult>;
  abstract update(id: string, input: MetadatoAmbienteInput): Observable<OperationResult>;
  abstract delete(id: string): Observable<OperationResult>;
}

