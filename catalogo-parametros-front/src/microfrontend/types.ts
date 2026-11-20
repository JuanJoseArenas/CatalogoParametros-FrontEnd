export interface ParametrosUiTheme { accent?: string; fontFamily?: string; radius?: string; }
export type ParametrosUiResource = 'modulos' | 'funcionalidades' | 'parametros' | 'metadatos' | 'metadatos-ambiente';
export interface ParametrosUiChange {
  applicationId: string;
  resource: ParametrosUiResource | 'aplicaciones' | 'ambientes' | 'tokens';
  operation: 'created' | 'updated' | 'deleted';
  id?: string;
}
export interface ParametrosUiOptions {
  /** ID de la aplicación del catálogo, no el ID de la aplicación de seguridad ni del token. */
  applicationId: string;
  /** URL del API, incluida la ruta /catalogo-parametros/api/v1. */
  apiBaseUrl: string;
  /** Cero deshabilita la actualización periódica. Mínimo 30000; por defecto 60000. */
  refreshIntervalMs?: number;
  theme?: ParametrosUiTheme;
  onAuthenticationRequired?: () => void;
  onChange?: (event: ParametrosUiChange) => void;
}
export interface ParametrosUiHandle {
  readonly element: HTMLElement;
  readonly ready: Promise<void>;
  refresh(): Promise<void>;
  unmount(): void;
}
