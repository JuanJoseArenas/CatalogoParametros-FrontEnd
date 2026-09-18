export interface Parametro { id: string; nombre: string; idFuncionalidad: string; idTipoParametro: string; activo: boolean; }
export interface TipoParametro { id: string; nombre: string; }
export type ParametroInput = Omit<Parametro, 'id'>;
