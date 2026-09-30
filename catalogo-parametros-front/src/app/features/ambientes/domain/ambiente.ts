export interface Ambiente {
  id: string;
  nombre: string;
}

export type AmbienteInput = Pick<Ambiente, 'nombre'>;

export interface AmbienteEvent {
  event: 'CREATED' | 'UPDATED' | 'DELETED';
  ambiente: Ambiente;
}

