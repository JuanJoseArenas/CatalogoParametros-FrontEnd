import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import { CargaMasivaParametrosService } from './carga-masiva-parametros.service';

describe('CargaMasivaParametrosService', () => {
  let service: CargaMasivaParametrosService;
  let http: HttpTestingController;
  const url = `${environment.apiUrl}/cargas-masivas/parametros`;
  const file = new File(['contenido'], 'catalogo.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [CargaMasivaParametrosService, provideHttpClient(withXhr()), provideHttpClientTesting()] });
    service = TestBed.inject(CargaMasivaParametrosService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('descarga la plantilla y el reporte', () => {
    service.descargarPlantilla().subscribe();
    let request = http.expectOne(`${url}/plantilla`);
    expect(request.request.method).toBe('GET');
    expect(request.request.responseType).toBe('blob');
    request.flush(new Blob(['xlsx']));

    service.descargarReporte(file).subscribe();
    request = http.expectOne(`${url}/reporte-errores`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body.get('archivo')).toEqual(file);
    request.flush(new Blob(['reporte']));
  });

  it('envia archivo como archivo al validar y cargar', () => {
    const result = { ready: true, totalFilas: 1, filasValidas: 1, filasInvalidas: 0, errores: [] };
    service.validar(file).subscribe(value => expect(value).toEqual(result));
    let request = http.expectOne(`${url}/validar`);
    expect(request.request.body.get('archivo')).toEqual(file);
    request.flush(result);

    service.cargar(file).subscribe(value => expect(value).toEqual(result));
    request = http.expectOne(url);
    expect(request.request.body.get('archivo')).toEqual(file);
    request.flush(result);
  });
});
