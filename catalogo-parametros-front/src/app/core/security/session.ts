import { SecurityConfig } from './security-config';

export function loginUrl(config: SecurityConfig, returnTo: string): string {
  const url = new URL(`${config.pdpUrl.replace(/\/$/, '')}/oauth2/authorization/keycloak`, document.baseURI);
  // El retorno siempre proviene de la ubicación del host, nunca de query params.
  url.searchParams.set('return_to', returnTo);
  return url.href;
}

export function redirectToLogin(config: SecurityConfig): void {
  window.location.assign(loginUrl(config, window.location.href));
}

export async function requireSession(config: SecurityConfig): Promise<boolean> {
  const response = await fetch(`${config.pdpUrl.replace(/\/$/, '')}/api/v1/session`, {
    credentials: 'include',
    cache: 'no-store',
    headers: { Accept: 'application/json' }
  });
  if (response.status === 401) {
    redirectToLogin(config);
    return false;
  }
  if (!response.ok) throw new Error('No fue posible consultar la sesión. Intenta nuevamente.');
  return true;
}
