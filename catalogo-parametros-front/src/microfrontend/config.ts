import { InjectionToken } from '@angular/core';
import type { ParametrosUiOptions } from './types';

export const PARAMETROS_UI_OPTIONS = new InjectionToken<ParametrosUiOptions>('ParametrosUiOptions');

export function normalizarOpciones(options: ParametrosUiOptions): ParametrosUiOptions {
  if (!options || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(options.applicationId)) {
    throw new TypeError('applicationId debe ser el UUID de una aplicación del catálogo.');
  }
  if ('secret' in options || 'secreto' in options || 'applicationCredential' in options) {
    throw new TypeError('El secreto de integración pertenece al backend consumidor, no al microfrontend.');
  }
  if (typeof options.apiBaseUrl !== 'string' || !options.apiBaseUrl.trim()) {
    throw new TypeError('apiBaseUrl es obligatoria.');
  }
  const url = new URL(options.apiBaseUrl, document.baseURI);
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (url.username || url.password || url.search || url.hash ||
      (url.protocol !== 'https:' && !(url.protocol === 'http:' && local && window.location.protocol !== 'https:'))) {
    throw new TypeError('apiBaseUrl debe usar HTTPS; HTTP solo se admite en localhost.');
  }
  const interval = options.refreshIntervalMs ?? 60000;
  if (!Number.isSafeInteger(interval) || (interval !== 0 && (interval < 30000 || interval > 86400000))) {
    throw new TypeError('refreshIntervalMs debe ser cero o un intervalo entre 30000 y 86400000.');
  }
  for (const callback of [options.onAuthenticationRequired, options.onChange]) {
    if (callback !== undefined && typeof callback !== 'function') throw new TypeError('Callback de integración inválido.');
  }
  return {
    applicationId: options.applicationId.toLowerCase(), apiBaseUrl: url.href.replace(/\/+$/, ''), refreshIntervalMs: interval,
    theme: { ...options.theme }, onAuthenticationRequired: options.onAuthenticationRequired, onChange: options.onChange
  };
}
