export interface Metadato {
  id: string;
  idParametro: string;
  idTipoMetadato: string;
  valor: string | Record<string, unknown> | unknown[];
}
