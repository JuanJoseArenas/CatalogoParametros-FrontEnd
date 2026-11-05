import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { handleApiError } from '../../../core/http/api-error';
import { CargaMasivaResultado } from '../domain/carga-masiva-parametros';

@Injectable()
export class CargaMasivaParametrosService {
  private readonly url = environment.apiUrl + '/cargas-masivas/parametros';

  constructor(private readonly http: HttpClient) {}

  descargarPlantilla(): Observable<Blob> {
    return this.http.get(this.url + '/plantilla', { responseType: 'blob' });
  }

  validar(file: File): Observable<CargaMasivaResultado> {
    return this.http.post<CargaMasivaResultado>(this.url + '/validar', this.formData(file)).pipe(catchError(handleApiError));
  }

  cargar(file: File): Observable<CargaMasivaResultado> {
    return this.http.post<CargaMasivaResultado>(this.url, this.formData(file)).pipe(catchError(handleApiError));
  }

  descargarReporte(file: File): Observable<Blob> {
    return this.http.post(this.url + '/reporte-errores', this.formData(file), { responseType: 'blob' });
  }

  private formData(file: File): FormData {
    const form = new FormData();
    form.append('archivo', file, file.name);
    return form;
  }
}
