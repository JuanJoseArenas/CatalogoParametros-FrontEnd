import { Routes } from '@angular/router';
import { HttpTokensRepository } from './infrastructure/http-tokens.repository';
import { HttpAplicacionesRepository } from '../aplicaciones/infrastructure/http-aplicaciones.repository';
import { HttpAmbientesRepository } from '../ambientes/infrastructure/http-ambientes.repository';
export const TOKENS_ROUTES: Routes = [{ path: '', providers: [HttpTokensRepository, HttpAplicacionesRepository, HttpAmbientesRepository], loadComponent: () => import('./presentation/pages/tokens.component').then(m => m.TokensComponent) }];

export const CONSULTA_PARAMETROS_ROUTES: Routes = [{ path: '', providers: [HttpTokensRepository, HttpAplicacionesRepository, HttpAmbientesRepository], loadComponent: () => import('./presentation/pages/consulta-parametros.component').then(m => m.ConsultaParametrosComponent) }];
