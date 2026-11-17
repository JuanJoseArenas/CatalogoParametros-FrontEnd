export interface Ambiente {
  id: string;
  nombre: string;
  activo: boolean;
}

export type AmbienteInput = Pick<Ambiente, 'nombre' | 'activo'>;

export interface AmbienteEvent {
  event: 'CREATED' | 'UPDATED' | 'DELETED';
  ambiente: Ambiente;
}

