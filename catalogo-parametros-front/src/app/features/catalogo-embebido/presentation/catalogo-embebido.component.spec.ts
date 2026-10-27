import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import { CatalogoEmbebidoComponent } from './catalogo-embebido.component';
import { CambioCatalogo, HttpCatalogoAplicacionService } from '../infrastructure/http-catalogo-aplicacion.service';
import { PARAMETROS_UI_OPTIONS } from '../../../../microfrontend/config';
import { APP_ID, catalogoFixture } from '../testing/catalogo.fixture';

describe('Administración embebida del catálogo', () => {
  let fixture: ComponentFixture<CatalogoEmbebidoComponent>; let component: CatalogoEmbebidoComponent;
  let api: jasmine.SpyObj<HttpCatalogoAplicacionService>; let change: jasmine.Spy;
  let eventos: Subject<CambioCatalogo>;
  beforeEach(async () => {
    api = jasmine.createSpyObj('catalogo', ['consultar', 'guardar', 'eliminar', 'escuchar']);
    eventos = new Subject<CambioCatalogo>(); api.escuchar.and.returnValue(eventos);
    api.consultar.and.returnValue(of(catalogoFixture())); api.guardar.and.returnValue(of({ mensajes: ['Guardado'] }));
    api.eliminar.and.returnValue(of({ mensajes: ['Eliminado'] })); change = jasmine.createSpy();
    await TestBed.configureTestingModule({ imports: [CatalogoEmbebidoComponent], providers: [
      { provide: HttpCatalogoAplicacionService, useValue: api },
      { provide: PARAMETROS_UI_OPTIONS, useValue: { applicationId: APP_ID, apiBaseUrl: 'http://localhost:8080/api', refreshIntervalMs: 0, onChange: change } }
    ] }).compileComponents();
    fixture = TestBed.createComponent(CatalogoEmbebidoComponent); component = fixture.componentInstance;
    fixture.detectChanges(); await component.initialLoad; fixture.detectChanges();
  });
  afterEach(() => fixture.destroy());
  it('actualiza valores por SSE, agrupa rafagas y avisa al host de cambios externos', async () => {
    const datos = catalogoFixture(); datos.metadatos[0].valor = 500; api.consultar.and.returnValue(of(datos));
    eventos.next({ recurso: 'conexion', operacion: 'CONNECTED', id: '' }); expect(component.conectado()).toBeTrue();
    for (let i = 0; i < 5; i++) eventos.next({ recurso: 'metadatos', operacion: 'UPDATED', id: 'metadato' });
    await new Promise(resolve => setTimeout(resolve, 320));
    expect(api.consultar).toHaveBeenCalledTimes(2); expect(component.datos()!.metadatos[0].valor).toBe(500);
    expect(change).toHaveBeenCalledWith(jasmine.objectContaining({ resource: 'metadatos', operation: 'updated' }));
  });
  it('conserva el formulario abierto y aplica cambios pendientes al cerrarlo', async () => {
    component.elegir('metadatos'); component.abrir(component.datos()!.metadatos[0]); component.form.controls.valor.setValue('999');
    eventos.next({ recurso: 'metadatos', operacion: 'UPDATED', id: 'metadato' });
    await new Promise(resolve => setTimeout(resolve, 320));
    expect(api.consultar).toHaveBeenCalledTimes(1); expect(component.form.controls.valor.value).toBe('999');
    expect(component.cambiosPendientes()).toBeTrue(); component.cerrar();
    await new Promise(resolve => setTimeout(resolve, 320)); expect(api.consultar).toHaveBeenCalledTimes(2);
  });
  it('exige ambiente al crear metadatos y cierra la escucha al destruirse', async () => {
    component.elegir('metadatos'); component.abrir(); component.form.patchValue({ idPadre: 'parametro', idTipo: 'tipo-meta', valor: '25' });
    await component.guardar(); expect(api.guardar).not.toHaveBeenCalled();
    fixture.destroy(); expect(eventos.observed).toBeFalse();
  });
  it('filtra por texto y representa estados y nombres auxiliares', () => {
    component.busqueda.set('inexistente'); expect(component.registros()).toEqual([]);
    component.busqueda.set('mod'); expect(component.registros().length).toBe(1);
    expect(component.estado({ id: 'x', activo: false })).toBe('Inactivo');
    component.elegir('metadatos');
    expect(component.estado({ id: 'x' })).toBe('Sin estado propio');
    expect(component.nombre(component.datos()!.metadatos[0])).toContain('numero');
    expect(component.resumen({ id: 'x' })).toBe('');
    component.elegir('metadatos-ambiente');
    expect(component.nombre(component.datos()!.metadatosAmbiente[0])).toContain('Desarrollo');
    expect(component.estado({ id: 'x' })).toBe('Sin estado');
    expect(component.estado(component.datos()!.metadatosAmbiente[0])).toBe('activo');
  });
  it('valida formularios y fechas antes de enviar y conserva errores al guardar', async () => {
    component.abrir(); await component.guardar(); expect(api.guardar).not.toHaveBeenCalled();
    component.form.patchValue({ nombre: 'Nuevo', fechaInicio: '2028-01-01T10:00:00', fechaFinal: '2027-01-01T10:00:00' });
    await component.guardar(); expect(component.error()).toContain('anterior');
    component.form.patchValue({ fechaFinal: '2029-01-01T10:00:00' });
    api.guardar.and.returnValue(throwError(() => new Error('No permitido')));
    await component.guardar(); expect(component.error()).toBe('No permitido'); expect(component.editor()).toBeTrue();
  });
  it('envia el padre de funcionalidades y parametros y bloquea acciones concurrentes', async () => {
    component.elegir('funcionalidades'); component.abrir(component.datos()!.funcionalidades[0]);
    component.form.patchValue({ fechaInicio: '2027-01-01T10:00:00', fechaFinal: '2028-01-01T10:00:00' });
    await component.guardar(); expect(api.guardar.calls.mostRecent().args[1].idModulo).toBe('modulo');
    component.elegir('parametros'); component.abrir(component.datos()!.parametros[0]);
    await component.guardar(); expect(api.guardar.calls.mostRecent().args[1].idFuncionalidad).toBe('funcion');
    component.busy.set(true); component.elegir('modulos'); expect(component.recurso()).toBe('parametros');
    component.abrir(); component.cerrar(); await component.eliminar();
  });
  it('propaga fallos al refrescar sin perder los datos anteriores', async () => {
    api.consultar.and.returnValue(throwError(() => 'fallo'));
    await expectAsync(component.refresh()).toBeRejected();
    expect(component.error()).toContain('No fue posible'); expect(component.datos()).not.toBeNull();
    component.datos.set(null); expect(component.registros()).toEqual([]); expect(component.padres()).toEqual([]);
  });
  it('muestra los datos de la aplicación sin navegación global del host', () => {
    expect(fixture.nativeElement.querySelector('h2').textContent).toBe('Gestión de parámetros');
    component.elegir('parametros'); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('SMMLV');
    expect(fixture.nativeElement.querySelector('iframe')).toBeNull();
  });
  it('mantiene visibles los inactivos y bloquea su uso como padres', () => {
    const datos = catalogoFixture(); datos.modulos[0].activo = false; component.datos.set(datos);
    component.elegir('funcionalidades');
    expect(component.padres()[0].disabled).toBeTrue();
    expect(component.registros().length).toBe(1);
  });
  it('envía fechas UTC y refresca el catálogo después de guardar un módulo', async () => {
    component.abrir(); component.form.patchValue({ nombre: 'Nuevo', fechaInicio: '2027-01-01T10:00:00', fechaFinal: '2028-01-01T10:00:00' });
    await component.guardar();
    const [resource, data] = api.guardar.calls.mostRecent().args;
    expect(resource).toBe('modulos'); expect(data.fechaInicio).toBe(new Date('2027-01-01T10:00:00').toISOString());
    expect(Object.prototype.hasOwnProperty.call(data, 'idAplicacion')).toBeFalse();
    expect(api.consultar).toHaveBeenCalledTimes(2);
    expect(change).toHaveBeenCalledWith(jasmine.objectContaining({ applicationId: APP_ID, operation: 'created' }));
  });
  it('rechaza JSON inválido sin enviar una mutación', async () => {
    component.elegir('metadatos'); component.abrir();
    component.form.patchValue({ idPadre: 'parametro', idTipo: 'tipo-meta', idAmbiente: 'ambiente', valor: '{incorrecto' });
    await component.guardar(); expect(api.guardar).not.toHaveBeenCalled(); expect(component.error()).toContain('JSON');
  });
  it('edita valores de metadato y asociaciones sin asignarles un estado inexistente', async () => {
    component.elegir('metadatos'); component.abrir(component.datos()!.metadatos[0]);
    component.form.patchValue({ valor: '200' }); await component.guardar();
    expect(api.guardar).toHaveBeenCalledWith('metadatos', { idParametro: 'parametro', idTipoMetadato: 'tipo-meta', idAmbiente: 'ambiente', valor: 200 }, 'metadato');
    component.elegir('metadatos-ambiente'); component.abrir(component.datos()!.metadatosAmbiente[0]); await component.guardar();
    expect(api.guardar).toHaveBeenCalledWith('metadatos-ambiente', { idParametro: 'parametro', idAmbiente: 'ambiente', idEstadoMetadatoAmbiente: 'activo' }, 'asociacion');
  });
  it('elimina mediante confirmación propia y conserva el mensaje de las reglas del servidor', async () => {
    component.borrarId.set('modulo'); await component.eliminar();
    expect(api.eliminar).toHaveBeenCalledWith('modulos', 'modulo'); expect(component.borrarId()).toBeNull();
    api.eliminar.and.returnValue(throwError(() => new Error('El módulo tiene funcionalidades asociadas.')));
    component.borrarId.set('modulo'); await component.eliminar(); expect(component.error()).toContain('funcionalidades');
  });
});
