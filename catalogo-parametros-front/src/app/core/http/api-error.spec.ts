import { HttpErrorResponse } from '@angular/common/http';
import { handleApiError } from './api-error';

describe('handleApiError', () => {
  const cases: Array<[number, unknown, string]> = [
    [0, {}, 'No se pudo conectar con el servidor'],
    [404, {}, 'Recurso no encontrado'],
    [400, { mensajes: ['dato inválido'] }, 'dato inválido'],
    [400, {}, 'Solicitud incorrecta'],
    [409, {}, 'Conflicto: el recurso ya existe'],
    [500, {}, 'Error interno del servidor'],
    [418, {}, 'Http failure response for /api: 418 Error']
  ];

  cases.forEach(([status, body, expected]) => {
    it(`traduce el estado HTTP ${status}`, done => {
      const error = new HttpErrorResponse({ status, error: body, statusText: 'Error', url: '/api' });
      handleApiError(error).subscribe({ error: result => { expect(result.message).toBe(expected); done(); } });
    });
  });
});
