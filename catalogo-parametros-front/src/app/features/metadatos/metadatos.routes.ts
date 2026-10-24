import { Routes } from '@angular/router';
import { HttpMetadatosRepository } from './infrastructure/http-metadatos.repository';
import { MetadatosRepository } from './domain/metadatos.repository';
import { HttpParametrosRepository } from '../parametros/infrastructure/http-parametros.repository';
import { ParametrosRepository } from '../parametros/domain/parametros.repository';
import { AmbientesRepository } from '../ambientes/domain/ambientes.repository';
import { HttpAmbientesRepository } from '../ambientes/infrastructure/http-ambientes.repository';

export const METADATOS_ROUTES: Routes = [{
  path: '',
  providers: [
    { provide: MetadatosRepository, useClass: HttpMetadatosRepository },
    { provide: ParametrosRepository, useClass: HttpParametrosRepository },
    { provide: AmbientesRepository, useClass: HttpAmbientesRepository }
  ],
  loadComponent: () => import('./presentation/pages/metadatos.component').then(m => m.MetadatosComponent)
}];
