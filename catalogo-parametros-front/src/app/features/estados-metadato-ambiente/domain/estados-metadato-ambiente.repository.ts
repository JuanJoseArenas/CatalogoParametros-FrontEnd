import { Observable } from 'rxjs';
import { OperationResult } from '../../../shared/contracts/operation-result';
import { EstadoMetadatoAmbiente, EstadoMetadatoAmbienteInput } from './estado-metadato-ambiente';

export abstract class EstadosMetadatoAmbienteRepository {
  abstract readonly eventsUrl: string;
  abstract findPage(page: number, pageSize: number): Observable<EstadoMetadatoAmbiente[]>;
  abstract findById(id: string): Observable<EstadoMetadatoAmbiente>;
  abstract create(input: EstadoMetadatoAmbienteInput): Observable<OperationResult>;
  abstract update(id: string, input: EstadoMetadatoAmbienteInput): Observable<OperationResult>;
  abstract delete(id: string): Observable<OperationResult>;
}

