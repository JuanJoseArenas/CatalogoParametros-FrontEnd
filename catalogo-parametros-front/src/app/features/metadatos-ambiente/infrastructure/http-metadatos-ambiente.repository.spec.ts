import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import { HttpMetadatosAmbienteRepository } from './http-metadatos-ambiente.repository';

describe('HttpMetadatosAmbienteRepository', () => {
  let repository: HttpMetadatosAmbienteRepository;
  let http: HttpTestingController;
  const url = `${environment.apiUrl}/metadatos-ambiente`;
  const input = { idParametro: 'p1', idAmbiente: 'a1', idEstadoMetadatoAmbiente: 'e1' };
  const entity = { id: 'm1', ...input };
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [HttpMetadatosAmbienteRepository, provideHttpClient(withXhr()), provideHttpClientTesting()] });
    repository = TestBed.inject(HttpMetadatosAmbienteRepository);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('consulta páginas y detalle usando metadatosAmbiente', () => {
    repository.findPage(2, 10).subscribe(data => expect(data).toEqual([entity]));
    const req = http.expectOne(request => request.url === url && request.params.get('page') === '2' && request.params.get('pageSize') === '10');
    expect(req.request.method).toBe('GET');
    req.flush({ mensajes: [], metadatosAmbiente: [entity] });
    repository.findById('m1').subscribe(data => expect(data).toEqual(entity));
    http.expectOne(url + '/m1').flush({ mensajes: [], metadatosAmbiente: [entity] });
    expect(repository.eventsUrl).toBe(url + '/events');
  });

  it('crea y actualiza enviando las tres referencias sin nombres ni ID propio', () => {
    repository.create(input).subscribe();
    let req = http.expectOne(url);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(input);
    req.flush({ mensajes: ['Creado'], metadatosAmbiente: [entity] });
    repository.update('m1', input).subscribe();
    req = http.expectOne(url + '/m1');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(input);
    req.flush({ mensajes: ['Actualizado'], metadatosAmbiente: [entity] });
  });

  it('elimina por ID y conserva el mensaje del backend', () => {
    repository.delete('m1').subscribe(result => expect(result.mensajes).toEqual(['Eliminado']));
    const req = http.expectOne(url + '/m1');
    expect(req.request.method).toBe('DELETE');
    req.flush({ mensajes: ['Eliminado'], metadatosAmbiente: [] });
  });

  it('propaga errores de validación y recurso no encontrado', () => {
    repository.create(input).subscribe({ error: (error: Error) => expect(error.message).toBe('Estado inválido') });
    http.expectOne(url).flush({ mensajes: ['Estado inválido'] }, { status: 400, statusText: 'Bad Request' });
    repository.findById('m1').subscribe({ error: (error: Error) => expect(error.message).toBe('Recurso no encontrado') });
    http.expectOne(url + '/m1').flush({}, { status: 404, statusText: 'Not Found' });
  });
});

