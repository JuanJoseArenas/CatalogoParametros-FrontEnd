export interface EstadoAmbiente {
  id: string;
  nombre: string;
}

export type EstadoAmbienteInput = Pick<EstadoAmbiente, 'nombre'>;

export interface EstadoAmbienteEvent {
  event: 'CREATED' | 'UPDATED' | 'DELETED';
  estadoAmbiente: EstadoAmbiente;
}

