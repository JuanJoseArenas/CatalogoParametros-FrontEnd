import { Routes } from '@angular/router';
import { HttpMetadatosRepository } from './data/http-metadatos.repository';
import { MetadatosRepository } from './domain/metadatos.repository';
import { HttpParametrosRepository } from '../parametros/data/http-parametros.repository';
import { ParametrosRepository } from '../parametros/domain/parametros.repository';

export const METADATOS_ROUTES: Routes = [{
  path: '',
  providers: [
    { provide: MetadatosRepository, useClass: HttpMetadatosRepository },
    { provide: ParametrosRepository, useClass: HttpParametrosRepository }
  ],
  loadComponent: () => import('./components/metadatos.component').then(m => m.MetadatosComponent)
}];
