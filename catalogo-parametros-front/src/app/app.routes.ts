import { Routes } from '@angular/router';
export const appRoutes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', loadComponent: () => import('./layout/components/dashboard/dashboard.component').then(m => m.DashboardComponent) },
  { path: 'organizaciones', loadChildren: () => import('./features/organizaciones/organizaciones.routes').then(m => m.ORGANIZACIONES_ROUTES) },
  { path: 'aplicaciones', loadChildren: () => import('./features/aplicaciones/aplicaciones.routes').then(m => m.APLICACIONES_ROUTES) },
  { path: 'modulos', loadChildren: () => import('./features/modulos/modulos.routes').then(m => m.MODULOS_ROUTES) },
  { path: 'funcionalidades', loadChildren: () => import('./features/funcionalidades/funcionalidades.routes').then(m => m.FUNCIONALIDADES_ROUTES) },
  { path: 'parametros', loadChildren: () => import('./features/parametros/parametros.routes').then(m => m.PARAMETROS_ROUTES) },
  { path: 'metadatos', loadChildren: () => import('./features/metadatos/metadatos.routes').then(m => m.METADATOS_ROUTES) },
  { path: '**', redirectTo: 'dashboard' }
];
