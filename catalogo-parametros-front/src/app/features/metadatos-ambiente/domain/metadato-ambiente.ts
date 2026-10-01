export interface MetadatoAmbiente {
  id: string;
  idParametro: string;
  idAmbiente: string;
  idEstadoMetadatoAmbiente: string;
}
export type MetadatoAmbienteInput = Omit<MetadatoAmbiente, 'id'>;
export interface MetadatoAmbienteEvent {
  event: 'CREATED' | 'UPDATED' | 'DELETED';
  metadatoAmbiente: MetadatoAmbiente;
}

