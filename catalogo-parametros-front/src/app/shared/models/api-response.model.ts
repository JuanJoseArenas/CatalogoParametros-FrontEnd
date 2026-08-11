import { Organizacion } from './organizacion.model';
import { Aplicacion } from './aplicacion.model';
import { Modulo } from './modulo.model';
import { Funcionalidad } from './funcionalidad.model';
import { Parametro } from './parametro.model';

export interface ApiResponse<T> {
  mensajes: string[];
  data?: T;
}

export interface OrganizacionResponse {
  mensajes: string[];
  organizaciones: Organizacion[];
}

export interface AplicacionResponse {
  mensajes: string[];
  aplicaciones: Aplicacion[];
}

export interface ModuloResponse {
  mensajes: string[];
  modulos: Modulo[];
}

export interface FuncionalidadResponse {
  mensajes: string[];
  funcionalidades: Funcionalidad[];
}

export interface ParametroResponse {
  mensajes: string[];
  parametros: Parametro[];
}
