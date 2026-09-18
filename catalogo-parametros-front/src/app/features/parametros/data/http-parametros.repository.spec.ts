import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import { HttpParametrosRepository } from './http-parametros.repository';

describe('HttpParametrosRepository', () => {
  let repository: HttpParametrosRepository; let http: HttpTestingController;
  const url = `${environment.apiUrl}/parametros`; const entity = { id: 'p1', nombre: 'Parámetro', idFuncionalidad: 'f1', idTipoParametro: 't1', activo: true };
  beforeEach(() => { TestBed.configureTestingModule({ providers: [HttpParametrosRepository, provideHttpClient(), provideHttpClientTesting()] }); repository = TestBed.inject(HttpParametrosRepository); http = TestBed.inject(HttpTestingController); });
  afterEach(() => http.verify());
  it('consulta páginas, todos los registros y tipos', () => {
    repository.findPage(1, 10).subscribe(v => expect(v).toEqual([entity])); let req = http.expectOne(r => r.url === url && r.params.get('pageSize') === '10'); req.flush({ mensajes: [], parametros: [entity] });
    repository.findAll().subscribe(); req = http.expectOne(r => r.url === url && r.params.get('pageSize') === '10000'); req.flush({ mensajes: [], parametros: [] });
    repository.findPage().subscribe(); req = http.expectOne(r => r.url === url && r.params.get('page') === '1' && r.params.get('pageSize') === '10'); req.flush({ mensajes: [], parametros: [] });
    repository.findTypes().subscribe(v => expect(v).toEqual([{ id: 't1', nombre: 'Texto' }])); req = http.expectOne(`${environment.apiUrl}/tipos-parametro`); req.flush({ mensajes: [], tiposParametro: [{ id: 't1', nombre: 'Texto' }] });
  });
  it('ejecuta todas las mutaciones', () => {
    const input = { nombre: 'Parámetro', idFuncionalidad: 'f1', idTipoParametro: 't1', activo: true };
    repository.create(input).subscribe(); let req = http.expectOne(url); expect(req.request.method).toBe('POST'); req.flush({ mensajes: [] });
    repository.update('p1', input).subscribe(); req = http.expectOne(`${url}/p1`); expect(req.request.method).toBe('PUT'); req.flush({ mensajes: [] });
    repository.changeStatus('p1', false).subscribe(); req = http.expectOne(`${url}/p1/cambiarestado`); expect(req.request.body).toEqual({ activo: false }); req.flush({ mensajes: [] });
    repository.delete('p1').subscribe(); req = http.expectOne(`${url}/p1`); expect(req.request.method).toBe('DELETE'); req.flush({ mensajes: [] });
  });
});
