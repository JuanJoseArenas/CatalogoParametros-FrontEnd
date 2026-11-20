export interface CatalogoToken {
  id: string;
  estadoToken: string;
  aplicacionId: string;
  ambienteId: string;
  fechaCreacion: string;
  fechaExpiracion: string | null;
}

export interface CatalogoEstadoToken { id: string; estado: string; }
export interface CatalogoAmbiente { id: string; nombre: string; }

export interface CrearCatalogoToken {
  token: string;
  estadoToken: string;
  aplicacionId: string;
  ambienteId: string;
  fechaExpiracion: string | null;
}

export interface CatalogoTokenParametros {
  id: string;
  nombre: string;
  activo: boolean;
  tipoParametro?: { tipo?: string; nombre?: string } | null;
  funcionalidad?: { nombre?: string } | null;
  modulo?: { nombre?: string } | null;
  valor?: unknown;
  metadatos?: Array<{ tipo?: string; valor?: unknown }>;
}

export interface CatalogoTokenDetalle {
  parametro: CatalogoTokenParametros;
  tipoParametro?: { tipo?: string; nombre?: string } | null;
  funcionalidad?: { nombre?: string } | null;
  modulo?: { nombre?: string } | null;
  metadatos?: Array<{ metadato?: { valor?: unknown } | null; tipoMetadato?: { tipo?: string } | null }>;
  configuracionAmbiente?: { estado?: { nombre?: string } | null } | null;
}

export interface ConsultaCatalogoToken {
  aplicacion: { id: string; nombre: string; activa?: boolean } | null;
  ambiente: CatalogoAmbiente | null;
  parametros: CatalogoTokenDetalle[];
  mensajes?: string[];
}
