import { loginUrl, requireSession } from './session';

describe('Sesion no autenticada', () => {
  it('usa el callback de redireccion sin recargar la pagina', async () => {
    const config = { pdpUrl: 'http://localhost:18080', securityUiUrl: 'http://localhost:5175/security-administration.js', applicationName: 'Catalogo' };
    const redirect = jasmine.createSpy('redirect');
    spyOn(window, 'fetch').and.resolveTo(new Response('', { status: 401 }));

    expect(await requireSession(config, redirect)).toBeFalse();
    expect(redirect).toHaveBeenCalledOnceWith(config);
  });
});

const config = { pdpUrl: 'http://localhost:18080', securityUiUrl: 'http://localhost:5175/security-administration.js', applicationName: 'Catalogo' };

describe('Sesión central', () => {
  it('comprueba la sesión con cookies y sin caché', async () => {
    const fetchSpy = spyOn(window, 'fetch').and.resolveTo(new Response('{}', { status: 200 }));
    expect(await requireSession(config)).toBeTrue();
    expect(fetchSpy).toHaveBeenCalledWith('http://localhost:18080/api/v1/session', jasmine.objectContaining({ credentials: 'include', cache: 'no-store' }));
  });

  it('detiene el arranque cuando el BFF falla', async () => {
    spyOn(window, 'fetch').and.resolveTo(new Response('', { status: 503 }));
    await expectAsync(requireSession(config)).toBeRejectedWithError(/sesión/);
  });

  it('detiene el arranque cuando falla la red', async () => {
    spyOn(window, 'fetch').and.rejectWith(new TypeError('network'));
    await expectAsync(requireSession(config)).toBeRejected();
  });

  it('conserva ruta y parámetros al construir el retorno del login', () => {
    const returnTo = `${window.location.origin}/parametros?page=2&nombre=uno`;
    const url = new URL(loginUrl(config, returnTo));
    expect(url.origin).toBe(config.pdpUrl);
    expect(url.pathname).toBe('/oauth2/authorization/keycloak');
    expect(url.searchParams.get('return_to')).toBe(returnTo);
  });

  it('rechaza un retorno de login hacia un servidor externo', () => {
    expect(() => loginUrl(config, 'https://otro.example/')).toThrowError(/retorno/);
    expect(() => loginUrl(config, '//otro.example/')).toThrowError(/retorno/);
  });

  it('no envía la sesión a un servidor indicado por una configuración manipulada', async () => {
    const fetchSpy = spyOn(window, 'fetch');
    await expectAsync(requireSession({ ...config, pdpUrl: 'https://otro.example' }))
      .toBeRejectedWithError(/confianza/);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('no construye un login hacia un servidor externo', () => {
    expect(() => loginUrl({ ...config, pdpUrl: 'https://otro.example' }, window.location.href))
      .toThrowError(/confianza/);
  });
});
