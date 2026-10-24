/** 256 bits aleatorios, en base64url y dentro del limite de entrada de BCrypt. */
export function generarSecretoIntegracion(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function propiedadesIntegracion(baseUrl: string, tokenId: string, applicationId: string): string {
  return [
    `catalogo.parametros.base-url=${baseUrl.replace(/\/$/, '')}`,
    `catalogo.parametros.application-id=${applicationId}`,
    `catalogo.parametros.token-id=${tokenId}`,
    'catalogo.parametros.secreto=${CATALOGO_PARAMETROS_SECRETO}'
  ].join('\n');
}
