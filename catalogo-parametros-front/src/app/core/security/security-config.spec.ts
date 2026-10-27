import { loadSecurityConfig, trustedPdpUrl } from './security-config';

describe('Configuracion de seguridad', () => {
  const config = {
    pdpUrl: 'http://localhost:18080',
    securityUiUrl: '/security-ui/security-administration.js',
    applicationName: 'Catalogo'
  };

  function respond(body: unknown, status = 200) {
    return spyOn(window, 'fetch').and.resolveTo(new Response(JSON.stringify(body), { status }));
  }

  it('carga la configuracion sin cache y acepta el modulo del mismo servidor', async () => {
    const fetchSpy = respond(config);
    expect(await loadSecurityConfig()).toEqual(config);
    expect(fetchSpy).toHaveBeenCalledOnceWith(
      new URL('assets/security-config.json', document.baseURI), { cache: 'no-store' }
    );
  });

  it('rechaza la configuracion cuando el servidor no permite consultarla', async () => {
    respond({}, 403);
    await expectAsync(loadSecurityConfig()).toBeRejectedWithError(/cargar/);
  });

  for (const invalid of [
    { ...config, applicationName: undefined },
    { ...config, applicationName: '   ' },
    { ...config, pdpUrl: '' },
    { ...config, securityUiUrl: '' }
  ]) {
    it(`rechaza una configuracion incompleta: ${JSON.stringify(invalid)}`, async () => {
      respond(invalid);
      await expectAsync(loadSecurityConfig()).toBeRejectedWithError(/incompleta/);
    });
  }

  for (const field of ['pdpUrl', 'securityUiUrl']) {
    it(`rechaza protocolos ejecutables en ${field}`, async () => {
      respond({ ...config, [field]: 'javascript:alert(1)' });
      await expectAsync(loadSecurityConfig()).toBeRejectedWithError(/inválida/);
    });
  }

  it('propaga errores de red sin aceptar una configuracion inexistente', async () => {
    spyOn(window, 'fetch').and.rejectWith(new TypeError('network'));
    await expectAsync(loadSecurityConfig()).toBeRejectedWithError(TypeError, 'network');
  });

  it('normaliza la barra final del PDP permitido', () => {
    expect(trustedPdpUrl({ ...config, pdpUrl: 'http://localhost:18080/' }))
      .toBe('http://localhost:18080');
  });

  for (const pdpUrl of [
    'http://localhost.otro.example:18080',
    'http://localhost:18081',
    'http://usuario:clave@localhost:18080',
    'http://localhost:18080/otro',
    'http://localhost:18080/?destino=otro',
    'http://localhost:18080/#otro'
  ]) {
    it(`rechaza un destino de sesion no permitido: ${pdpUrl}`, () => {
      expect(() => trustedPdpUrl({ ...config, pdpUrl })).toThrowError(/confianza/);
    });
  }
});
