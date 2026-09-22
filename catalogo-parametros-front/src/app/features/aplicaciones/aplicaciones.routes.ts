import { Routes } from '@angular/router';
import { HttpAplicacionesRepository } from './infrastructure/http-aplicaciones.repository';
import { AplicacionesRepository } from './domain/aplicaciones.repository';
import { HttpOrganizacionesRepository } from '../organizaciones/infrastructure/http-organizaciones.repository';
import { OrganizacionesRepository } from '../organizaciones/domain/organizaciones.repository';

export const APLICACIONES_ROUTES: Routes = [{
  path: '',
  providers: [
    { provide: AplicacionesRepository, useClass: HttpAplicacionesRepository },
    { provide: OrganizacionesRepository, useClass: HttpOrganizacionesRepository }
  ],
  loadComponent: () => import('./presentation/pages/aplicaciones.component').then(m => m.AplicacionesComponent)
}];
