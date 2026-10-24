import type { Aplicacion } from '../../aplicaciones/domain/aplicacion';
import type { Modulo } from '../../modulos/domain/modulo';
import type { Funcionalidad } from '../../funcionalidades/domain/funcionalidad';
import type { Parametro, TipoParametro } from '../../parametros/domain/parametro';
import type { TipoMetadato } from '../../metadatos/domain/metadato';
import type { MetadatoAmbiente } from '../../metadatos-ambiente/domain/metadato-ambiente';

export interface RegistroEditable {
  id: string; nombre?: string; activo?: boolean; fechaInicio?: string; fechaFinal?: string;
  idModulo?: string; idFuncionalidad?: string; idTipoParametro?: string; idParametro?: string;
  idTipoMetadato?: string; idAmbiente?: string | null; idEstadoMetadatoAmbiente?: string; valor?: unknown;
}
export interface CatalogoAplicacion {
  aplicacion: Aplicacion; modulos: Modulo[]; funcionalidades: Funcionalidad[]; parametros: Parametro[];
  metadatos: Array<{ id: string; idParametro: string; idTipoMetadato: string; idAmbiente?: string | null; valor: unknown }>;
  metadatosAmbiente: MetadatoAmbiente[]; ambientes: Array<{ id: string; nombre: string }>;
  tiposParametro: TipoParametro[]; tiposMetadato: TipoMetadato[];
  estadosMetadatoAmbiente: Array<{ id: string; nombre: string }>;
}
export interface SolicitudCatalogo {
  nombre?: string; activo?: boolean; fechaInicio?: string; fechaFinal?: string;
  idModulo?: string; idFuncionalidad?: string; idTipoParametro?: string; idParametro?: string;
  idTipoMetadato?: string; idAmbiente?: string; idEstadoMetadatoAmbiente?: string; valor?: unknown;
}
