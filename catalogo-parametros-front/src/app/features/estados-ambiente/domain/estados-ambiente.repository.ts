import { Observable } from 'rxjs';
import { OperationResult } from '../../../shared/contracts/operation-result';
import { EstadoAmbiente, EstadoAmbienteInput } from './estado-ambiente';

export abstract class EstadosAmbienteRepository {
  abstract readonly eventsUrl: string;
  abstract findPage(page: number, pageSize: number): Observable<EstadoAmbiente[]>;
  abstract findById(id: string): Observable<EstadoAmbiente>;
  abstract create(input: EstadoAmbienteInput): Observable<OperationResult>;
  abstract update(id: string, input: EstadoAmbienteInput): Observable<OperationResult>;
  abstract delete(id: string): Observable<OperationResult>;
}

