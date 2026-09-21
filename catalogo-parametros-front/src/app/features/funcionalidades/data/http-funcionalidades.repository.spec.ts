import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import { HttpFuncionalidadesRepository } from './http-funcionalidades.repository';

describe('HttpFuncionalidadesRepository', () => {
  let repository: HttpFuncionalidadesRepository; let http: HttpTestingController;
  const url = `${environment.apiUrl}/funcionalidades`; const entity = { id: 'f1', nombre: 'Función', idModulo: 'm1', activo: true };
  beforeEach(() => { TestBed.configureTestingModule({ providers: [HttpFuncionalidadesRepository, provideHttpClient(withXhr()), provideHttpClientTesting()] }); repository = TestBed.inject(HttpFuncionalidadesRepository); http = TestBed.inject(HttpTestingController); });
  afterEach(() => http.verify());
  it('consulta páginas y todos los registros', () => {
    repository.findPage(1, 8).subscribe(v => expect(v).toEqual([entity])); let req = http.expectOne(r => r.url === url && r.params.get('pageSize') === '8'); req.flush({ mensajes: [], funcionalidades: [entity] });
    repository.findAll().subscribe(); req = http.expectOne(r => r.url === url && r.params.get('pageSize') === '10000'); req.flush({ mensajes: [], funcionalidades: [] });
    repository.findPage().subscribe(); req = http.expectOne(r => r.url === url && r.params.get('page') === '1' && r.params.get('pageSize') === '10'); req.flush({ mensajes: [], funcionalidades: [] });
  });
  it('ejecuta todas las mutaciones', () => {
    const input = { nombre: 'Función', idModulo: 'm1', activo: true };
    repository.create(input).subscribe(); let req = http.expectOne(url); expect(req.request.method).toBe('POST'); req.flush({ mensajes: [] });
    repository.update('f1', input).subscribe(); req = http.expectOne(`${url}/f1`); expect(req.request.method).toBe('PUT'); req.flush({ mensajes: [] });
    repository.changeStatus('f1', false).subscribe(); req = http.expectOne(`${url}/f1/cambiarestado`); expect(req.request.body).toEqual({ activo: false }); req.flush({ mensajes: [] });
    repository.delete('f1').subscribe(); req = http.expectOne(`${url}/f1`); expect(req.request.method).toBe('DELETE'); req.flush({ mensajes: [] });
  });
});
