import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import { HttpMetadatosRepository } from './http-metadatos.repository';

describe('HttpMetadatosRepository', () => {
  let repository: HttpMetadatosRepository; let http: HttpTestingController;
  const url = `${environment.apiUrl}/metadatos`; const entity = { id: 'md1', idParametro: 'p1', idTipoMetadato: 't1', valor: 'valor' };
  beforeEach(() => { TestBed.configureTestingModule({ providers: [HttpMetadatosRepository, provideHttpClient(withXhr()), provideHttpClientTesting()] }); repository = TestBed.inject(HttpMetadatosRepository); http = TestBed.inject(HttpTestingController); });
  afterEach(() => http.verify());
  it('consulta metadatos con y sin filtro', () => {
    repository.findAll().subscribe(v => expect(v).toEqual([entity])); let req = http.expectOne(r => r.url === url && !r.params.has('idParametro')); req.flush({ mensajes: [], metadatos: [entity] });
    repository.findAll('p1').subscribe(); req = http.expectOne(r => r.url === url && r.params.get('idParametro') === 'p1'); req.flush({ mensajes: [], metadatos: [] });
  });
  it('consulta tipos y ejecuta mutaciones', () => {
    repository.findTypes().subscribe(v => expect(v[0].tipo).toBe('json')); let req = http.expectOne(`${environment.apiUrl}/tipos-metadato`); req.flush({ mensajes: [], tiposMetadato: [{ id: 't1', tipo: 'json', detalle: 'JSON' }] });
    const input = { idParametro: 'p1', idTipoMetadato: 't1', valor: '{}' };
    repository.create(input).subscribe(); req = http.expectOne(url); expect(req.request.method).toBe('POST'); req.flush({ mensajes: [] });
    repository.update('md1', input).subscribe(); req = http.expectOne(`${url}/md1`); expect(req.request.method).toBe('PUT'); req.flush({ mensajes: [] });
    repository.delete('md1').subscribe(); req = http.expectOne(`${url}/md1`); expect(req.request.method).toBe('DELETE'); req.flush({ mensajes: [] });
  });
});
