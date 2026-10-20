import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SECURITY_CONFIG } from './security-config';
import { redirectToLogin } from './session';

export const sessionInterceptor: HttpInterceptorFn = (request, next) => {
  const config = inject(SECURITY_CONFIG);
  const api = new URL(environment.apiUrl, document.baseURI);
  const target = new URL(request.url, document.baseURI);
  const apiPath = api.pathname.replace(/\/$/, '');
  const isApi = target.origin === api.origin &&
    (target.pathname === apiPath || target.pathname.startsWith(`${apiPath}/`));
  if (!isApi) return next(request);
  const isTokenQuery = request.method === 'GET' &&
    /^\/tokens\/[^/]+\/parametros$/.test(target.pathname.slice(apiPath.length));
  return next(request.clone({ withCredentials: true })).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && !isTokenQuery) redirectToLogin(config);
      return throwError(() => error);
    })
  );
};
