import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { HttpCatalogoAplicacionService } from './http-catalogo-aplicacion.service';
import { PARAMETROS_UI_OPTIONS } from '../../../../microfrontend/config';
import { APP_ID, catalogoFixture } from '../testing/catalogo.fixture';
describe('API embebida por aplicación', () => {
  let api: HttpCatalogoAplicacionService; let http: HttpTestingController; let login: jasmine.Spy;
  const root = `http://localhost:8080/catalogo-parametros/api/v1/aplicaciones/${APP_ID}/administracion`;
  beforeEach(() => {
    login = jasmine.createSpy('login');
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(),
      { provide: PARAMETROS_UI_OPTIONS, useValue: { apiBaseUrl: 'http://localhost:8080/catalogo-parametros/api/v1', applicationId: APP_ID, onAuthenticationRequired: login } }] });
    api = TestBed.inject(HttpCatalogoAplicacionService); http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('escucha el SSE de su aplicacion con credenciales y libera la conexion', () => {
    const listeners = new Map<string, EventListener>();
    const source = { onopen: null as ((event: Event) => void) | null, onerror: null as ((event: Event) => void) | null,
      addEventListener: (name: string, listener: EventListener) => listeners.set(name, listener), close: jasmine.createSpy('close') };
    const factory = spyOn(window, 'EventSource').and.returnValue(source as unknown as EventSource);
    const recibidos: string[] = []; const subscription = api.escuchar().subscribe(event => recibidos.push(event.operacion));
    expect(factory).toHaveBeenCalledWith(root + '/events', { withCredentials: true });
    source.onopen!(new Event('open'));
    listeners.get('catalogo-aplicacion')!(new MessageEvent('catalogo-aplicacion', { data: JSON.stringify({ recurso: 'metadatos', operacion: 'UPDATED', id: 'm' }) }));
    expect(recibidos).toEqual(['CONNECTED', 'UPDATED']); subscription.unsubscribe(); expect(source.close).toHaveBeenCalled();
  });
  it('notifica desconexion y reintenta con espera sin mantener conexiones viejas', () => {
    jasmine.clock().install();
    try {
      const sources: Array<{ onopen: ((event: Event) => void) | null; onerror: ((event: Event) => void) | null; addEventListener: jasmine.Spy; close: jasmine.Spy }> = [];
      spyOn(window, 'EventSource').and.callFake(function () {
        const source = { onopen: null, onerror: null, addEventListener: jasmine.createSpy(), close: jasmine.createSpy() };
        sources.push(source); return source as unknown as EventSource;
      });
      const values: string[] = []; const subscription = api.escuchar().subscribe(event => values.push(event.operacion));
      sources[0].onerror!(new Event('error')); expect(values).toEqual(['DISCONNECTED']); expect(sources[0].close).toHaveBeenCalled();
      jasmine.clock().tick(1999); expect(sources.length).toBe(1); jasmine.clock().tick(1); expect(sources.length).toBe(2);
      subscription.unsubscribe(); expect(sources[1].close).toHaveBeenCalled(); jasmine.clock().tick(60000); expect(sources.length).toBe(2);
    } finally { jasmine.clock().uninstall(); }
  });
  it('consulta solo la aplicación configurada y utiliza la sesión, sin secreto de integración', () => {
    api.consultar().subscribe(value => expect(value.aplicacion.id).toBe(APP_ID));
    const request = http.expectOne(root);
    expect(request.request.withCredentials).toBeTrue();
    expect(request.request.headers.has('Authorization')).toBeFalse();
    request.flush({ catalogo: catalogoFixture() });
  });
  it('rechaza una respuesta que corresponde a otra aplicación', () => {
    api.consultar().subscribe({ error: (error: Error) => expect(error.message).toContain('no corresponde') });
    const other = catalogoFixture(); other.aplicacion.id = 'otra';
    http.expectOne(root).flush({ catalogo: other });
  });
  it('crea, actualiza y elimina a través de los endpoints de su aplicación', () => {
    api.guardar('parametros', { nombre: 'Nuevo', activo: true }).subscribe();
    const crear = http.expectOne(root + '/parametros'); expect(crear.request.method).toBe('POST'); crear.flush({ mensajes: [] });
    api.guardar('parametros', { nombre: 'Editado' }, 'id/con espacio').subscribe();
    const actualizar = http.expectOne(root + '/parametros/id%2Fcon%20espacio'); expect(actualizar.request.method).toBe('PUT'); actualizar.flush({ mensajes: [] });
    api.eliminar('parametros', 'id').subscribe();
    const eliminar = http.expectOne(root + '/parametros/id'); expect(eliminar.request.method).toBe('DELETE'); eliminar.flush({ mensajes: [] });
  });
  it('avisa al host cuando falta sesión y conserva el control de permisos del servidor', () => {
    api.consultar().subscribe({ error: (error: Error) => expect(error.message).toContain('sesión') });
    http.expectOne(root).flush({}, { status: 401, statusText: 'Unauthorized' }); expect(login).toHaveBeenCalledTimes(1);
    api.eliminar('modulos', 'id').subscribe({ error: (error: Error) => expect(error.message).toContain('permiso') });
    http.expectOne(root + '/modulos/id').flush({}, { status: 403, statusText: 'Forbidden' });
  });
});
