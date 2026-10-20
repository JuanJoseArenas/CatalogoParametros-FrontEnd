import { HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';

export function handleApiError(error: HttpErrorResponse): Observable<never> {
  let message = 'Error en la comunicacion con el servidor';

  if (error.status === 0) {
    message = 'No se pudo conectar con el servidor';
  } else if (error.status === 401) {
    message = 'La sesión ha expirado. Inicia sesión nuevamente';
  } else if (error.status === 403) {
    message = 'No tienes permiso para realizar esta operación';
  } else if (error.status === 503) {
    message = 'El servicio no está disponible. Intenta nuevamente más tarde';
  } else if (error.status === 404) {
    message = 'Recurso no encontrado';
  } else if (error.status === 400 || error.status === 409) {
    const messages = (error.error as { mensajes?: string[] } | null)?.mensajes;
    message = messages?.[0] ?? (error.status === 409 ? 'Conflicto: el recurso ya existe' : 'Solicitud incorrecta');
  } else if (error.status === 500) {
    message = 'Error interno del servidor';
  } else if (error.message) {
    message = error.message;
  }

  return throwError(() => new Error(message));
}
