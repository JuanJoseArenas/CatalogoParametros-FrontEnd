import { SecurityConfig, trustedPdpUrl } from './security-config';

export function loginUrl(config: SecurityConfig, returnTo: string): string {
  const url = new URL('/oauth2/authorization/keycloak', trustedPdpUrl(config));
  const returnUrl = new URL(returnTo, window.location.origin);
  if (returnUrl.origin !== window.location.origin || returnUrl.username || returnUrl.password) {
    throw new Error('El retorno del login debe pertenecer a esta aplicación.');
  }
  url.searchParams.set('return_to', returnUrl.href);
  return url.href;
}

export function redirectToLogin(config: SecurityConfig): void {
  window.location.assign(loginUrl(config, window.location.href));
}

export async function requireSession(config: SecurityConfig): Promise<boolean> {
  const response = await fetch(`${trustedPdpUrl(config)}/api/v1/session`, {
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
