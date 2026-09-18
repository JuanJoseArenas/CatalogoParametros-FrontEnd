import { Routes } from '@angular/router';
import { HttpParametrosRepository } from './data/http-parametros.repository';
import { ParametrosRepository } from './domain/parametros.repository';
import { HttpFuncionalidadesRepository } from '../funcionalidades/data/http-funcionalidades.repository';
import { FuncionalidadesRepository } from '../funcionalidades/domain/funcionalidades.repository';

export const PARAMETROS_ROUTES: Routes = [{
  path: '',
  providers: [
    { provide: ParametrosRepository, useClass: HttpParametrosRepository },
    { provide: FuncionalidadesRepository, useClass: HttpFuncionalidadesRepository }
  ],
  loadComponent: () => import('./components/parametros.component').then(m => m.ParametrosComponent)
}];
