export interface Metadato { id: string; idParametro: string; idTipoMetadato: string; idAmbiente: string | null; valor: string | Record<string, unknown> | unknown[]; }
export interface TipoMetadato { id: string; tipo: string; detalle: string; }
export type MetadatoInput = Omit<Metadato, 'id' | 'idAmbiente'> & { idAmbiente: string };
