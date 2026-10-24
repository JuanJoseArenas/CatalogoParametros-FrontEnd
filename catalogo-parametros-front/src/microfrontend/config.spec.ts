import { normalizarOpciones } from './config';
import { APP_ID } from '../app/features/catalogo-embebido/testing/catalogo.fixture';
import type { ParametrosUiOptions } from './types';
describe('Contrato de integración del microfrontend', () => {
  const options: ParametrosUiOptions = { applicationId: APP_ID, apiBaseUrl: 'https://catalogo.example/api/' };
  it('normaliza la URL y limita la frecuencia predeterminada a un minuto', () => {
    const result = normalizarOpciones(options);
    expect(result.apiBaseUrl).toBe('https://catalogo.example/api');
    expect(result.refreshIntervalMs).toBe(60000);
  });
  it('permite deshabilitar la actualización periódica y conserva callbacks del host', () => {
    const callback = jasmine.createSpy();
    expect(normalizarOpciones({ ...options, refreshIntervalMs: 0, onChange: callback }).onChange).toBe(callback);
  });
  it('rechaza identificadores ajenos al contrato y bucles de actualización agresivos', () => {
    expect(() => normalizarOpciones({ ...options, applicationId: 'otro' })).toThrowError(TypeError);
    expect(() => normalizarOpciones({ ...options, refreshIntervalMs: 1 })).toThrowError(TypeError);
  });
  it('rechaza secretos de servidor en la configuración del navegador', () => {
    expect(() => normalizarOpciones({ ...options, secreto: 'no-debe-estar-aqui' } as ParametrosUiOptions)).toThrowError(/backend/);
  });
  it('rechaza protocolos, credenciales y fragmentos en la URL del API', () => {
    for (const apiBaseUrl of ['javascript:alert(1)', 'https://user:secret@example.com/api', 'https://example.com/api#otro']) {
      expect(() => normalizarOpciones({ ...options, apiBaseUrl })).toThrowError(TypeError);
    }
  });
  it('exige URL y callbacks validos y rechaza intervalos fuera de limites', () => {
    for (const refreshIntervalMs of [-1, 86400001, 1.5]) {
      expect(() => normalizarOpciones({ ...options, refreshIntervalMs })).toThrowError(TypeError);
    }
    for (const apiBaseUrl of ['', 'https://example.com/api?secret=x']) {
      expect(() => normalizarOpciones({ ...options, apiBaseUrl })).toThrowError(TypeError);
    }
    expect(() => normalizarOpciones(null as unknown as ParametrosUiOptions)).toThrowError(TypeError);
    expect(() => normalizarOpciones({ ...options, onChange: 3 } as unknown as ParametrosUiOptions)).toThrowError(TypeError);
    expect(normalizarOpciones({ ...options, applicationId: APP_ID.toUpperCase(), refreshIntervalMs: 30000 }).refreshIntervalMs).toBe(30000);
  });
});
