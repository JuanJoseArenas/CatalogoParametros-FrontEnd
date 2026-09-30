import { Routes } from '@angular/router';
import { MetadatosAmbienteRepository } from './domain/metadatos-ambiente.repository';
import { HttpMetadatosAmbienteRepository } from './infrastructure/http-metadatos-ambiente.repository';
import { AmbientesRepository } from '../ambientes/domain/ambientes.repository';
import { HttpAmbientesRepository } from '../ambientes/infrastructure/http-ambientes.repository';
import { EstadosMetadatoAmbienteRepository } from '../estados-metadato-ambiente/domain/estados-metadato-ambiente.repository';
import { HttpEstadosMetadatoAmbienteRepository } from '../estados-metadato-ambiente/infrastructure/http-estados-metadato-ambiente.repository';
import { ParametrosRepository } from '../parametros/domain/parametros.repository';
import { HttpParametrosRepository } from '../parametros/infrastructure/http-parametros.repository';

export const METADATOS_AMBIENTE_ROUTES: Routes = [{
  path: '',
  providers: [
    { provide: MetadatosAmbienteRepository, useClass: HttpMetadatosAmbienteRepository },
    { provide: AmbientesRepository, useClass: HttpAmbientesRepository },
    { provide: EstadosMetadatoAmbienteRepository, useClass: HttpEstadosMetadatoAmbienteRepository },
    { provide: ParametrosRepository, useClass: HttpParametrosRepository }
  ],
  loadComponent: () => import('./presentation/pages/metadatos-ambiente.component').then(m => m.MetadatosAmbienteComponent)
}];

