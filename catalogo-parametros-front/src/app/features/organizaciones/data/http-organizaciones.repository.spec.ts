import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import { HttpOrganizacionesRepository } from './http-organizaciones.repository';

describe('HttpOrganizacionesRepository', () => {
  let repository: HttpOrganizacionesRepository;
  let http: HttpTestingController;
  const url = `${environment.apiUrl}/organizaciones`;
  const entity = { id: 'o1', nombre: 'UCO' };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [HttpOrganizacionesRepository, provideHttpClient(), provideHttpClientTesting()] });
    repository = TestBed.inject(HttpOrganizacionesRepository);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('consulta una pagina y expone la URL de eventos', () => {
    repository.findPage(2, 5).subscribe(data => expect(data).toEqual([entity]));
    const request = http.expectOne(r => r.url === url && r.params.get('page') === '2' && r.params.get('pageSize') === '5');
    expect(request.request.method).toBe('GET');
    request.flush({ mensajes: [], organizaciones: [entity] });
    expect(repository.eventsUrl).toBe(`${url}/events`);
  });

  it('consulta todos los registros', () => {
    repository.findAll().subscribe(data => expect(data).toEqual([entity]));
    const request = http.expectOne(r => r.url === url && r.params.get('pageSize') === '10000');
    request.flush({ mensajes: [], organizaciones: [entity] });
    repository.findPage().subscribe();
    http.expectOne(r => r.url === url && r.params.get('page') === '1' && r.params.get('pageSize') === '10').flush({ mensajes: [], organizaciones: [] });
  });

  it('crea, actualiza y elimina', () => {
    const input = { nombre: 'UCO' };
    repository.create(input).subscribe(r => expect(r.mensajes).toEqual(['ok']));
    let request = http.expectOne(url); expect(request.request.method).toBe('POST'); expect(request.request.body).toEqual(input); request.flush({ mensajes: ['ok'] });
    repository.update('o1', input).subscribe();
    request = http.expectOne(`${url}/o1`); expect(request.request.method).toBe('PUT'); request.flush({ mensajes: [] });
    repository.delete('o1').subscribe();
    request = http.expectOne(`${url}/o1`); expect(request.request.method).toBe('DELETE'); request.flush({ mensajes: [] });
  });

  it('transforma errores HTTP', () => {
    repository.findPage(1, 10).subscribe({ error: error => expect(error.message).toBe('Recurso no encontrado') });
    http.expectOne(r => r.url === url).flush({}, { status: 404, statusText: 'Not Found' });
  });
});
