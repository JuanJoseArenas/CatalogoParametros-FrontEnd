import { Routes } from '@angular/router';
import { DashboardComponent } from './layout/components/dashboard/dashboard.component';
import { OrganizacionesComponent } from './features/organizaciones/components/organizaciones.component';
import { AplicacionesComponent } from './features/aplicaciones/components/aplicaciones.component';
import { ModulosComponent } from './features/modulos/components/modulos.component';
import { FuncionalidadesComponent } from './features/funcionalidades/components/funcionalidades.component';
import { ParametrosComponent } from './features/parametros/components/parametros.component';

export const appRoutes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'organizaciones', component: OrganizacionesComponent },
  { path: 'aplicaciones', component: AplicacionesComponent },
  { path: 'modulos', component: ModulosComponent },
  { path: 'funcionalidades', component: FuncionalidadesComponent },
  { path: 'parametros', component: ParametrosComponent }
];
