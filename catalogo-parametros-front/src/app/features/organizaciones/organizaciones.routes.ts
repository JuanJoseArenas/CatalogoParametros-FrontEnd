import { Routes } from '@angular/router';
import { HttpOrganizacionesRepository } from './infrastructure/http-organizaciones.repository';
import { OrganizacionesRepository } from './domain/organizaciones.repository';

export const ORGANIZACIONES_ROUTES: Routes = [{
  path: '',
  providers: [{ provide: OrganizacionesRepository, useClass: HttpOrganizacionesRepository }],
  loadComponent: () => import('./presentation/pages/organizaciones.component').then(m => m.OrganizacionesComponent)
}];
