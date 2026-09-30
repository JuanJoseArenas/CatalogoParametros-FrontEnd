import { Routes } from '@angular/router';
import { AmbientesRepository } from './domain/ambientes.repository';
import { HttpAmbientesRepository } from './infrastructure/http-ambientes.repository';

export const AMBIENTES_ROUTES: Routes = [{
  path: '',
  providers: [{ provide: AmbientesRepository, useClass: HttpAmbientesRepository }],
  loadComponent: () => import('./presentation/pages/ambientes.component').then(m => m.AmbientesComponent)
}];

