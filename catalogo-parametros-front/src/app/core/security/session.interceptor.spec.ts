import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
import { SECURITY_CONFIG } from './security-config';
import { sessionInterceptor } from './session.interceptor';

describe('Cookies de la API protegida', () => {
  let http: HttpClient;
  let requests: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [
      provideHttpClient(withInterceptors([sessionInterceptor])), provideHttpClientTesting(),
      { provide: SECURITY_CONFIG, useValue: { pdpUrl: 'http://localhost:18080' } }
    ] });
    http = TestBed.inject(HttpClient);
    requests = TestBed.inject(HttpTestingController);
  });

  afterEach(() => requests.verify());

  it('incluye credenciales en la API del catalogo', () => {
    const url = `${environment.apiUrl}/parametros`;
    http.get(url).subscribe();
    const request = requests.expectOne(url);
    expect(request.request.withCredentials).toBeTrue();
    request.flush({});
  });

  it('no incluye credenciales en otros servidores', () => {
    const url = 'https://otro.example/catalogo-parametros/api/v1/parametros';
    http.get(url).subscribe();
    const request = requests.expectOne(url);
    expect(request.request.withCredentials).toBeFalse();
    request.flush({});
  });

  it('redirige cualquier 401 de la API a la sesion', () => {
    const url = `${environment.apiUrl}/parametros`;
    let status = 0;
    http.get(url).subscribe({ error: error => status = error.status });
    requests.expectOne(url).flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(status).toBe(401);
  });
});
