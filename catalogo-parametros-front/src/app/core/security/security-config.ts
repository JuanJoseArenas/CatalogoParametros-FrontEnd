import { InjectionToken } from '@angular/core';

export interface SecurityConfig {
  pdpUrl: string;
  securityUiUrl: string;
  applicationName: string;
  applicationId?: string;
}

export const SECURITY_CONFIG = new InjectionToken<SecurityConfig>('SecurityConfig');

// Los destinos de confianza pertenecen al despliegue, no al JSON descargado.
const TRUSTED_PDP_URLS = ['http://localhost:18080'] as const;

export function trustedPdpUrl(config: SecurityConfig): string {
  const configured = new URL(config.pdpUrl, window.location.origin);
  const trusted = TRUSTED_PDP_URLS.find(origin => origin === configured.origin);
  if (!trusted || configured.username || configured.password || configured.search ||
      configured.hash || configured.pathname !== '/') {
    throw new Error('El servidor de seguridad no es de confianza.');
  }
  // Retornar el valor de la lista local, nunca la URL recibida por la red.
  return trusted;
}

export async function loadSecurityConfig(): Promise<SecurityConfig> {
  const response = await fetch(new URL('assets/security-config.json', document.baseURI), { cache: 'no-store' });
  if (!response.ok) throw new Error('No fue posible cargar la configuración de seguridad.');
  const config = await response.json() as SecurityConfig;
  if (!config.applicationName?.trim() || !config.pdpUrl || !config.securityUiUrl) {
    throw new Error('La configuración de seguridad está incompleta.');
  }
  for (const value of [config.pdpUrl, config.securityUiUrl]) {
    const url = new URL(value, document.baseURI);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('URL de seguridad inválida.');
    if (location.protocol === 'https:' && url.protocol !== 'https:') {
      throw new Error('Las URLs de seguridad deben usar HTTPS.');
    }
  }
  return config;
}
