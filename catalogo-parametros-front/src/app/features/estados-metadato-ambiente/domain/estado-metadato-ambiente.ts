export interface EstadoMetadatoAmbiente {
  id: string;
  nombre: string;
}

export type EstadoMetadatoAmbienteInput = Pick<EstadoMetadatoAmbiente, 'nombre'>;

export interface EstadoMetadatoAmbienteEvent {
  event: 'CREATED' | 'UPDATED' | 'DELETED';
  estadoMetadatoAmbiente: EstadoMetadatoAmbiente;
}

