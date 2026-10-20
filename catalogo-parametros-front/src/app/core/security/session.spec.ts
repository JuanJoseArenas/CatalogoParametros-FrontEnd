import { loginUrl, requireSession } from './session';

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
    const returnTo = 'http://localhost:4200/parametros?page=2&nombre=uno';
    const url = new URL(loginUrl(config, returnTo));
    expect(url.origin).toBe(config.pdpUrl);
    expect(url.pathname).toBe('/oauth2/authorization/keycloak');
    expect(url.searchParams.get('return_to')).toBe(returnTo);
  });
});
