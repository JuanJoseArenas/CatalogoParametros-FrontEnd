export interface EstadoToken { id: string; estado: string; }
export interface Token { id: string; estadoToken: string; aplicacionId: string; ambienteId: string; fechaCreacion: string; fechaExpiracion: string | null; }
export interface CrearTokenInput { token: string; estadoToken: string; aplicacionId: string; ambienteId: string; fechaExpiracion: string | null; }
