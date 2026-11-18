import { Observable } from 'rxjs';
import { EstadoMetadatoAmbiente } from './estado-metadato-ambiente';

export abstract class EstadosMetadatoAmbienteRepository {
  abstract findPage(page: number, pageSize: number): Observable<EstadoMetadatoAmbiente[]>;
  abstract findById(id: string): Observable<EstadoMetadatoAmbiente>;
}

