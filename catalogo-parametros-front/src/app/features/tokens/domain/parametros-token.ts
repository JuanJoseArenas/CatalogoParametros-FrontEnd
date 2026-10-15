import { Aplicacion } from '../../aplicaciones/domain/aplicacion';
import { Ambiente } from '../../ambientes/domain/ambiente';
import { Parametro, TipoParametro } from '../../parametros/domain/parametro';
import { Funcionalidad } from '../../funcionalidades/domain/funcionalidad';
import { Modulo } from '../../modulos/domain/modulo';
import { Metadato, TipoMetadato } from '../../metadatos/domain/metadato';
import { MetadatoAmbiente } from '../../metadatos-ambiente/domain/metadato-ambiente';
import { EstadoMetadatoAmbiente } from '../../estados-metadato-ambiente/domain/estado-metadato-ambiente';
import { OperationResult } from '../../../shared/contracts/operation-result';
export interface ParametroTokenDetalle {
  parametro: Parametro;
  tipoParametro: TipoParametro | null;
  funcionalidad: Funcionalidad | null;
  modulo: Modulo | null;
  metadatos: { metadato: Metadato; tipoMetadato: TipoMetadato | null }[];
  configuracionAmbiente: { asociacion: MetadatoAmbiente; estado: EstadoMetadatoAmbiente | null } | null;
}
export interface ParametrosTokenResponse extends OperationResult {
  aplicacion: Aplicacion | null;
  ambiente: Ambiente | null;
  parametros: ParametroTokenDetalle[];
}
