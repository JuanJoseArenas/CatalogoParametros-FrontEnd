import { Observable } from 'rxjs';
import { IdentidadServicio, IdentidadServicioInput } from './identidad-servicio';
import { OperationResult } from '../../../shared/contracts/operation-result';

export abstract class IdentidadesServicioRepository {
  abstract findByAplicacion(idAplicacion: string): Observable<IdentidadServicio[]>;
  abstract register(idAplicacion: string, input: IdentidadServicioInput): Observable<OperationResult>;
  abstract remove(idAplicacion: string, clientId: string): Observable<OperationResult>;
}
