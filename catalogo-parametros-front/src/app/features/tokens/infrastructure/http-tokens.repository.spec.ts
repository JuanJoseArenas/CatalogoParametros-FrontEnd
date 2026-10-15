import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import { HttpTokensRepository } from './http-tokens.repository';
describe('HttpTokensRepository', () => {
  let repository: HttpTokensRepository;
  let http: HttpTestingController;
  const url = `${environment.apiUrl}/tokens`;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [HttpTokensRepository, provideHttpClient(withXhr()), provideHttpClientTesting()] });
    repository = TestBed.inject(HttpTokensRepository); http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('interpreta un 401 como validación negativa sin ocultar errores de conexión', () => {
    repository.validate('id', 'secret').subscribe(value => expect(value).toBeFalse());
    const req = http.expectOne(`${url}/id/validar`);
    expect(req.request.method).toBe('POST'); expect(req.request.body).toEqual({ token: 'secret' });
    req.flush({ valido: false }, { status: 401, statusText: 'Unauthorized' });
    repository.validate('id', 'secret').subscribe({ error: (e: Error) => expect(e.message).toContain('conectar') });
    http.expectOne(`${url}/id/validar`).error(new ProgressEvent('error'));
  });
  it('envía el secreto únicamente en la cabecera Bearer al consultar parámetros', () => {
    const response = { aplicacion: null, ambiente: null, parametros: [], mensajes: [] };
    repository.findParameters('id', 'secret').subscribe(value => expect(value).toEqual(response));
    const req = http.expectOne(`${url}/id/parametros`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer secret');
    expect(req.request.params.keys()).toEqual([]);
    req.flush(response);
  });
  it('muestra un mensaje comprensible cuando se rechaza el acceso a parámetros', () => {
    repository.findParameters('id', 'secret').subscribe({ error: (e: Error) => expect(e.message).toContain('expirado') });
    http.expectOne(`${url}/id/parametros`).flush({}, { status: 401, statusText: 'Unauthorized' });
  });
  it('actualiza el estado por PATCH sin reenviar el secreto', () => {
    repository.changeState('id', 'revocado').subscribe();
    const req = http.expectOne(`${url}/id/estado`);
    expect(req.request.method).toBe('PATCH'); expect(req.request.body).toEqual({ estadoToken: 'revocado' });
    req.flush({ tokens: [], mensajes: [] });
  });
});
