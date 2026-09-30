import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import { HttpAmbientesRepository } from './http-ambientes.repository';

describe('HttpAmbientesRepository', () => {
  let repository: HttpAmbientesRepository;
  let http: HttpTestingController;
  const url = `${environment.apiUrl}/ambientes`;
  const ambiente = { id: 'a1', nombre: 'Producción' };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [
      HttpAmbientesRepository, provideHttpClient(withXhr()), provideHttpClientTesting()
    ] });
    repository = TestBed.inject(HttpAmbientesRepository);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('consulta la página y el detalle con los contratos del backend', () => {
    repository.findPage(2, 10).subscribe(value => expect(value).toEqual([ambiente]));
    const page = http.expectOne(req => req.url === url && req.params.get('page') === '2' && req.params.get('pageSize') === '10');
    expect(page.request.method).toBe('GET');
    page.flush({ ambientes: [ambiente], mensajes: [] });
    repository.findById('a1').subscribe(value => expect(value).toEqual(ambiente));
    http.expectOne(`${url}/a1`).flush({ ambientes: [ambiente], mensajes: [] });
    expect(repository.eventsUrl).toBe(`${url}/events`);
  });

  it('envía únicamente el nombre al crear y actualizar y elimina por ID', () => {
    const input = { nombre: 'Pruebas' };
    repository.create(input).subscribe();
    let req = http.expectOne(url);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(input);
    req.flush({ mensajes: ['Creado'], ambientes: [ambiente] });
    repository.update('a1', input).subscribe();
    req = http.expectOne(`${url}/a1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(input);
    req.flush({ mensajes: ['Actualizado'], ambientes: [ambiente] });
    repository.delete('a1').subscribe();
    req = http.expectOne(`${url}/a1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ mensajes: ['Eliminado'], ambientes: [] });
  });

  it('propaga el mensaje de conflicto del backend', () => {
    repository.create({ nombre: 'Producción' }).subscribe({
      next: () => fail('Se esperaba un conflicto'),
      error: (error: Error) => expect(error.message).toContain('Ya existe')
    });
    http.expectOne(url).flush({ mensajes: ['Ya existe ambiente con el nombre indicado.'] }, { status: 409, statusText: 'Conflict' });
  });
});

