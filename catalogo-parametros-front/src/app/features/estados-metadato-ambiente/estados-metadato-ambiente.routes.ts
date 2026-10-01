import { Routes } from '@angular/router';
import { EstadosMetadatoAmbienteRepository } from './domain/estados-metadato-ambiente.repository';
import { HttpEstadosMetadatoAmbienteRepository } from './infrastructure/http-estados-metadato-ambiente.repository';

export const ESTADOS_METADATO_AMBIENTE_ROUTES: Routes = [{
  path: '',
  providers: [{ provide: EstadosMetadatoAmbienteRepository, useClass: HttpEstadosMetadatoAmbienteRepository }],
  loadComponent: () => import('./presentation/pages/estados-metadato-ambiente.component').then(m => m.EstadosMetadatoAmbienteComponent)
}];

