import { Routes } from '@angular/router';
import { HttpFuncionalidadesRepository } from './data/http-funcionalidades.repository';
import { FuncionalidadesRepository } from './domain/funcionalidades.repository';
import { HttpModulosRepository } from '../modulos/data/http-modulos.repository';
import { ModulosRepository } from '../modulos/domain/modulos.repository';

export const FUNCIONALIDADES_ROUTES: Routes = [{
  path: '',
  providers: [
    { provide: FuncionalidadesRepository, useClass: HttpFuncionalidadesRepository },
    { provide: ModulosRepository, useClass: HttpModulosRepository }
  ],
  loadComponent: () => import('./components/funcionalidades.component').then(m => m.FuncionalidadesComponent)
}];
