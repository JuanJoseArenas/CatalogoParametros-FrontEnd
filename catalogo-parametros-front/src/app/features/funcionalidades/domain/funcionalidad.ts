export interface Funcionalidad { id: string; nombre: string; idModulo: string; activo: boolean; fechaInicio?: string; fechaFinal?: string; }
export type FuncionalidadInput = Omit<Funcionalidad, 'id'>;
