import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import { HttpAplicacionesRepository } from './http-aplicaciones.repository';

describe('HttpAplicacionesRepository', () => {
  let repository: HttpAplicacionesRepository; let http: HttpTestingController;
  const url = `${environment.apiUrl}/aplicaciones`;
  const entity = { id: 'a1', nombre: 'App', idOrganizacion: 'o1', activa: true };
  beforeEach(() => { TestBed.configureTestingModule({ providers: [HttpAplicacionesRepository, provideHttpClient(), provideHttpClientTesting()] }); repository = TestBed.inject(HttpAplicacionesRepository); http = TestBed.inject(HttpTestingController); });
  afterEach(() => http.verify());
  it('consulta páginas y todos los registros', () => {
    repository.findPage(1, 10).subscribe(v => expect(v).toEqual([entity]));
    let req = http.expectOne(r => r.url === url && r.params.get('pageSize') === '10'); expect(req.request.method).toBe('GET'); req.flush({ mensajes: [], aplicaciones: [entity] });
    repository.findAll().subscribe(); req = http.expectOne(r => r.url === url && r.params.get('pageSize') === '10000'); req.flush({ mensajes: [], aplicaciones: [] });
    repository.findPage().subscribe(); req = http.expectOne(r => r.url === url && r.params.get('page') === '1' && r.params.get('pageSize') === '10'); req.flush({ mensajes: [], aplicaciones: [] });
  });
  it('ejecuta todas las mutaciones', () => {
    const input = { nombre: 'App', idOrganizacion: 'o1', activa: true };
    repository.create(input).subscribe(); let req = http.expectOne(url); expect(req.request.method).toBe('POST'); req.flush({ mensajes: [] });
    repository.update('a1', input).subscribe(); req = http.expectOne(`${url}/a1`); expect(req.request.method).toBe('PUT'); req.flush({ mensajes: [] });
    repository.changeStatus('a1', false).subscribe(); req = http.expectOne(`${url}/a1/cambiarestado`); expect(req.request.body).toEqual({ activo: false }); req.flush({ mensajes: [] });
    repository.delete('a1').subscribe(); req = http.expectOne(`${url}/a1`); expect(req.request.method).toBe('DELETE'); req.flush({ mensajes: [] });
    expect(repository.eventsUrl).toBe(`${url}/events`);
  });
});
