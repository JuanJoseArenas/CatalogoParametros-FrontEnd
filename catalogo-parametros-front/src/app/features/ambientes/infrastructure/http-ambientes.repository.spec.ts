import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import { HttpAmbientesRepository } from './http-ambientes.repository';

describe('HttpAmbientesRepository', () => {
  let repository: HttpAmbientesRepository;
  let http: HttpTestingController;
  const url = `${environment.apiUrl}/ambientes`;
  const ambiente = { id: 'a1', nombre: 'Produccion' };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [
      HttpAmbientesRepository, provideHttpClient(withXhr()), provideHttpClientTesting()
    ] });
    repository = TestBed.inject(HttpAmbientesRepository);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('consulta la página y el detalle desde el endpoint del backend', () => {
    repository.findPage(2, 10).subscribe(value => expect(value).toEqual([ambiente]));
    const page = http.expectOne(request => request.url === url
      && request.params.get('page') === '2'
      && request.params.get('pageSize') === '10');
    expect(page.request.method).toBe('GET');
    page.flush({ ambientes: [ambiente], mensajes: [] });

    repository.findById('a1').subscribe(value => expect(value).toEqual(ambiente));
    http.expectOne(`${url}/a1`).flush({ ambientes: [ambiente], mensajes: [] });
  });

  it('propaga el mensaje de error del backend', () => {
    repository.findPage(1, 10).subscribe({
      next: () => fail('Se esperaba un error'),
      error: (error: Error) => expect(error.message).toBe('Error interno del servidor')
    });
    http.expectOne(request => request.url === url
      && request.params.get('page') === '1'
      && request.params.get('pageSize') === '10').flush({ mensajes: ['No se pudo consultar ambientes.'] }, {
      status: 500,
      statusText: 'Server Error'
    });
  });

});
