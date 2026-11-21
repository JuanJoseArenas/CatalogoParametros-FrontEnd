import { Routes } from '@angular/router';
import { HttpAplicacionesRepository } from './infrastructure/http-aplicaciones.repository';
import { AplicacionesRepository } from './domain/aplicaciones.repository';
import { HttpOrganizacionesRepository } from '../organizaciones/infrastructure/http-organizaciones.repository';
import { OrganizacionesRepository } from '../organizaciones/domain/organizaciones.repository';
import { HttpAmbientesRepository } from '../ambientes/infrastructure/http-ambientes.repository';
import { AmbientesRepository } from '../ambientes/domain/ambientes.repository';
import { HttpIdentidadesServicioRepository } from '../identidades-servicio/infrastructure/http-identidades-servicio.repository';
import { IdentidadesServicioRepository } from '../identidades-servicio/domain/identidades-servicio.repository';

export const APLICACIONES_ROUTES: Routes = [{
  path: '',
  providers: [
    { provide: AplicacionesRepository, useClass: HttpAplicacionesRepository },
    { provide: OrganizacionesRepository, useClass: HttpOrganizacionesRepository },
    { provide: AmbientesRepository, useClass: HttpAmbientesRepository },
    { provide: IdentidadesServicioRepository, useClass: HttpIdentidadesServicioRepository }
  ],
  loadComponent: () => import('./presentation/pages/aplicaciones.component').then(m => m.AplicacionesComponent)
}];
