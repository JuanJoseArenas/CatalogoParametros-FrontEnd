import { Routes } from '@angular/router';
import { HttpFuncionalidadesRepository } from './infrastructure/http-funcionalidades.repository';
import { FuncionalidadesRepository } from './domain/funcionalidades.repository';
import { HttpModulosRepository } from '../modulos/infrastructure/http-modulos.repository';
import { ModulosRepository } from '../modulos/domain/modulos.repository';

export const FUNCIONALIDADES_ROUTES: Routes = [{
  path: '',
  providers: [
    { provide: FuncionalidadesRepository, useClass: HttpFuncionalidadesRepository },
    { provide: ModulosRepository, useClass: HttpModulosRepository }
  ],
  loadComponent: () => import('./presentation/pages/funcionalidades.component').then(m => m.FuncionalidadesComponent)
}];
