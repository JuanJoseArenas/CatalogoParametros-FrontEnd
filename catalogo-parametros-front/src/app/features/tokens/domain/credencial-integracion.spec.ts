import { generarSecretoIntegracion, propiedadesIntegracion } from './credencial-integracion';
describe('Credencial de integración con el catálogo', () => {
  it('utiliza 32 bytes criptográficos y un secreto base64url compatible con BCrypt', () => {
    const random = spyOn(crypto, 'getRandomValues').and.callThrough();
    const secret = generarSecretoIntegracion();
    expect(random).toHaveBeenCalled();
    expect(random.calls.mostRecent().args[0]!.byteLength).toBe(32);
    expect(secret).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });
  it('genera secretos distintos sin almacenarlos en el navegador', () => {
    const storage = spyOn(Storage.prototype, 'setItem');
    expect(generarSecretoIntegracion()).not.toBe(generarSecretoIntegracion());
    expect(storage).not.toHaveBeenCalled();
  });
  it('exporta properties con referencia de entorno y no con un secreto incrustado', () => {
    const text = propiedadesIntegracion('https://catalogo.example/api/', 'token-id', 'app-id');
    expect(text.split('\n').length).toBe(4);
    expect(text).toContain('catalogo.parametros.token-id=token-id');
    expect(text).toContain('catalogo.parametros.secreto=${CATALOGO_PARAMETROS_SECRETO}');
    expect(text).toContain('catalogo.parametros.application-id=app-id');
  });
});
