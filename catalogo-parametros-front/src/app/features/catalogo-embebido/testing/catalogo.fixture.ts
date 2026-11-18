import type { CatalogoAplicacion } from '../domain/catalogo-aplicacion';
export const APP_ID = '11111111-1111-4111-8111-111111111111';
export function catalogoFixture(): CatalogoAplicacion {
  return {
    aplicacion: { id: APP_ID, nombre: 'Aplicación de ejemplo', idOrganizacion: 'org', activa: true },
    modulos: [{ id: 'modulo', nombre: 'Módulo', idAplicacion: APP_ID, activo: true }],
    funcionalidades: [{ id: 'funcion', nombre: 'Funcionalidad', idModulo: 'modulo', activo: true }],
    parametros: [{ id: 'parametro', nombre: 'SMMLV', idFuncionalidad: 'funcion', idTipoParametro: 'tipo', activo: true }],
    metadatos: [{ id: 'metadato', idParametro: 'parametro', idTipoMetadato: 'tipo-meta', idAmbiente: 'ambiente', valor: 100 }],
    metadatosAmbiente: [{ id: 'asociacion', idParametro: 'parametro', idAmbiente: 'ambiente', idEstadoMetadatoAmbiente: '00000000-0000-0000-0000-000000000020' }],
    ambientes: [{ id: 'ambiente', nombre: 'Desarrollo' }],
    tiposParametro: [{ id: 'tipo', nombre: 'General' }],
    tiposMetadato: [{ id: 'tipo-meta', tipo: 'numero', detalle: '' }],
    estadosMetadatoAmbiente: [
      { id: '00000000-0000-0000-0000-000000000020', nombre: 'Activo' },
      { id: '00000000-0000-0000-0000-000000000021', nombre: 'Inactivo' }
    ]
  };
}
