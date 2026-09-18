export interface Aplicacion { id: string; nombre: string; idOrganizacion: string; activa: boolean; fechaInicio?: string; fechaFinal?: string; }
export type AplicacionInput = Omit<Aplicacion, 'id'>;
