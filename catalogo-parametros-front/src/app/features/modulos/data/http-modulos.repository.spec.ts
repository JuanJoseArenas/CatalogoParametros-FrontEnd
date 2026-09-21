import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import { HttpModulosRepository } from './http-modulos.repository';

describe('HttpModulosRepository', () => {
  let repository: HttpModulosRepository; let http: HttpTestingController;
  const url = `${environment.apiUrl}/modulos`; const entity = { id: 'm1', nombre: 'Módulo', idAplicacion: 'a1', activo: true };
  beforeEach(() => { TestBed.configureTestingModule({ providers: [HttpModulosRepository, provideHttpClient(withXhr()), provideHttpClientTesting()] }); repository = TestBed.inject(HttpModulosRepository); http = TestBed.inject(HttpTestingController); });
  afterEach(() => http.verify());
  it('consulta páginas y todos los registros', () => {
    repository.findPage(3, 4).subscribe(v => expect(v).toEqual([entity])); let req = http.expectOne(r => r.url === url && r.params.get('page') === '3'); req.flush({ mensajes: [], modulos: [entity] });
    repository.findAll().subscribe(); req = http.expectOne(r => r.url === url && r.params.get('pageSize') === '10000'); req.flush({ mensajes: [], modulos: [] });
    repository.findPage().subscribe(); req = http.expectOne(r => r.url === url && r.params.get('page') === '1' && r.params.get('pageSize') === '10'); req.flush({ mensajes: [], modulos: [] });
  });
  it('ejecuta todas las mutaciones', () => {
    const input = { nombre: 'Módulo', idAplicacion: 'a1', activo: true };
    repository.create(input).subscribe(); let req = http.expectOne(url); expect(req.request.method).toBe('POST'); req.flush({ mensajes: [] });
    repository.update('m1', input).subscribe(); req = http.expectOne(`${url}/m1`); expect(req.request.method).toBe('PUT'); req.flush({ mensajes: [] });
    repository.changeStatus('m1', false).subscribe(); req = http.expectOne(`${url}/m1/cambiarestado`); expect(req.request.body).toEqual({ activo: false }); req.flush({ mensajes: [] });
    repository.delete('m1').subscribe(); req = http.expectOne(`${url}/m1`); expect(req.request.method).toBe('DELETE'); req.flush({ mensajes: [] });
  });
});
