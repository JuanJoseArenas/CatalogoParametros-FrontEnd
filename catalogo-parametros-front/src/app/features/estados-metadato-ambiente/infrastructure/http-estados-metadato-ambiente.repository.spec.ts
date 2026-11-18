import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import { HttpEstadosMetadatoAmbienteRepository } from './http-estados-metadato-ambiente.repository';

describe('HttpEstadosMetadatoAmbienteRepository', () => {
  let repository: HttpEstadosMetadatoAmbienteRepository;
  let http: HttpTestingController;
  const url = `${environment.apiUrl}/estados-metadato-ambiente`;
  const estadoMetadatoAmbiente = {
    id: '00000000-0000-0000-0000-000000000020',
    nombre: 'Activo'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [
      HttpEstadosMetadatoAmbienteRepository, provideHttpClient(withXhr()), provideHttpClientTesting()
    ] });
    repository = TestBed.inject(HttpEstadosMetadatoAmbienteRepository);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('consulta la página y el detalle del catálogo fijo', () => {
    repository.findPage(2, 10).subscribe(value => expect(value).toEqual([estadoMetadatoAmbiente]));
    const page = http.expectOne(req => req.url === url && req.params.get('page') === '2'
      && req.params.get('pageSize') === '10');
    expect(page.request.method).toBe('GET');
    page.flush({ estadosMetadatoAmbiente: [estadoMetadatoAmbiente], mensajes: [] });

    repository.findById(estadoMetadatoAmbiente.id).subscribe(value => expect(value).toEqual(estadoMetadatoAmbiente));
    http.expectOne(`${url}/${estadoMetadatoAmbiente.id}`)
      .flush({ estadosMetadatoAmbiente: [estadoMetadatoAmbiente], mensajes: [] });
  });
});
