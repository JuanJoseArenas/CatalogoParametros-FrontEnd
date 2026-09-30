import { Routes } from '@angular/router';
import { EstadosAmbienteRepository } from './domain/estados-ambiente.repository';
import { HttpEstadosAmbienteRepository } from './infrastructure/http-estados-ambiente.repository';

export const ESTADOS_AMBIENTE_ROUTES: Routes = [{
  path: '',
  providers: [{ provide: EstadosAmbienteRepository, useClass: HttpEstadosAmbienteRepository }],
  loadComponent: () => import('./presentation/pages/estados-ambiente.component').then(m => m.EstadosAmbienteComponent)
}];

