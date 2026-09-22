import { Routes } from '@angular/router';
import { HttpModulosRepository } from './infrastructure/http-modulos.repository';
import { ModulosRepository } from './domain/modulos.repository';
import { HttpAplicacionesRepository } from '../aplicaciones/infrastructure/http-aplicaciones.repository';
import { AplicacionesRepository } from '../aplicaciones/domain/aplicaciones.repository';

export const MODULOS_ROUTES: Routes = [{
  path: '',
  providers: [
    { provide: ModulosRepository, useClass: HttpModulosRepository },
    { provide: AplicacionesRepository, useClass: HttpAplicacionesRepository }
  ],
  loadComponent: () => import('./presentation/pages/modulos.component').then(m => m.ModulosComponent)
  
}];
