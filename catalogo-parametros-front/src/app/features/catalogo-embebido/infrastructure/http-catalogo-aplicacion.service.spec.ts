import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { HttpCatalogoAplicacionService } from './http-catalogo-aplicacion.service';
import { PARAMETROS_UI_OPTIONS } from '../../../../microfrontend/config';
import { APP_ID, catalogoFixture } from '../testing/catalogo.fixture';

describe('API embebida por aplicacion', () => {
  let api: HttpCatalogoAplicacionService;
  let http: HttpTestingController;
  let login: jasmine.Spy;
  const root = `http://localhost:8080/catalogo-parametros/api/v1/aplicaciones/${APP_ID}/administracion`;

  beforeEach(() => {
    login = jasmine.createSpy('login');
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(),
        { provide: PARAMETROS_UI_OPTIONS, useValue: { apiBaseUrl: 'http://localhost:8080/catalogo-parametros/api/v1', applicationId: APP_ID, environmentId: 'ambiente', onAuthenticationRequired: login } }]
    });
    api = TestBed.inject(HttpCatalogoAplicacionService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('consulta solo su aplicacion con la sesion web y sin secreto interno', () => {
    api.consultar().subscribe(value => expect(value.aplicacion.id).toBe(APP_ID));
    const request = http.expectOne(root);
    expect(request.request.withCredentials).toBeTrue();
    expect(request.request.headers.has('Authorization')).toBeFalse();
    request.flush({ catalogo: catalogoFixture() });
  });

  it('crea, actualiza y elimina recursos del catalogo seleccionado', () => {
    api.guardar('parametros', { nombre: 'Nuevo', activo: true }).subscribe();
    const crear = http.expectOne(root + '/parametros');
    expect(crear.request.method).toBe('POST');
    crear.flush({ mensajes: [] });

    api.guardar('parametros', { nombre: 'Editado' }, 'id/con espacio').subscribe();
    const actualizar = http.expectOne(root + '/parametros/id%2Fcon%20espacio');
    expect(actualizar.request.method).toBe('PUT');
    actualizar.flush({ mensajes: [] });

    api.eliminar('parametros', 'id').subscribe();
    const eliminar = http.expectOne(root + '/parametros/id');
    expect(eliminar.request.method).toBe('DELETE');
    eliminar.flush({ mensajes: [] });
  });

  it('limita la respuesta al ambiente autorizado', () => {
    api.consultar().subscribe(value => {
      expect(value.modulos.length).toBe(catalogoFixture().modulos.length);
      expect(value.funcionalidades.length).toBe(catalogoFixture().funcionalidades.length);
      expect(value.parametros.length).toBe(catalogoFixture().parametros.length);
      expect(value.metadatos.every(item => item.idAmbiente === 'ambiente')).toBeTrue();
      expect(value.metadatosAmbiente.every(item => item.idAmbiente === 'ambiente')).toBeTrue();
      expect(value.ambientes).toEqual([{ id: 'ambiente', nombre: 'Desarrollo' }]);
    });
    const request = http.expectOne(root);
    request.flush({ catalogo: catalogoFixture() });
  });

  it('solicita autenticacion cuando la sesion expira', () => {
    api.consultar().subscribe({ error: () => undefined });
    http.expectOne(root).flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(login).toHaveBeenCalledTimes(1);
  });
});
