import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <aside class="sidebar">
      <div class="sidebar-header">
        <img class="sidebar-logo" src="assets/logo-uco.png" alt="Universidad Católica de Oriente">
        <div class="sidebar-product">Catálogo de parámetros</div>
        <p class="sidebar-subtitle">Administración y consulta institucional</p>
      </div>
      <nav>
        <div class="nav-heading">Inicio</div>
        <ul class="nav-menu">
          <li class="nav-item"><a routerLink="/dashboard" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" class="nav-link"><span class="nav-icon" aria-hidden="true">I</span>Inicio</a></li>
        </ul>
        <div class="nav-heading">Administración</div>
        <ul class="nav-menu">
          <li class="nav-item"><a routerLink="/organizaciones" routerLinkActive="active" class="nav-link"><span class="nav-icon" aria-hidden="true">O</span>Organizaciones</a></li>
          <li class="nav-item"><a routerLink="/aplicaciones" routerLinkActive="active" class="nav-link"><span class="nav-icon" aria-hidden="true">A</span>Aplicaciones</a></li>
          <li class="nav-item"><a routerLink="/modulos" routerLinkActive="active" class="nav-link"><span class="nav-icon" aria-hidden="true">M</span>Módulos</a></li>
          <li class="nav-item"><a routerLink="/funcionalidades" routerLinkActive="active" class="nav-link"><span class="nav-icon" aria-hidden="true">F</span>Funcionalidades</a></li>
          <li class="nav-item"><a routerLink="/parametros" routerLinkActive="active" class="nav-link"><span class="nav-icon" aria-hidden="true">P</span>Parámetros</a></li>
          <li class="nav-item"><a routerLink="/metadatos" routerLinkActive="active" class="nav-link"><span class="nav-icon" aria-hidden="true">D</span>Metadatos</a></li>
          <li class="nav-item"><a routerLink="/metadatos-ambiente" routerLinkActive="active" class="nav-link"><span class="nav-icon" aria-hidden="true">E</span>Metadatos por ambiente</a></li>
        </ul>
        <div class="nav-heading">Integraciones</div>
        <ul class="nav-menu">
          <li class="nav-item"><a routerLink="/tokens" routerLinkActive="active" class="nav-link"><span class="nav-icon" aria-hidden="true">T</span>Tokens</a></li>
          <li class="nav-item"><a routerLink="/consulta-parametros" routerLinkActive="active" class="nav-link"><span class="nav-icon" aria-hidden="true">C</span>Consulta de parámetros</a></li>
          <li class="nav-item"><a routerLink="/mensajes" routerLinkActive="active" class="nav-link"><span class="nav-icon" aria-hidden="true">G</span>Mensajes</a></li>
          <li class="nav-item"><a routerLink="/seguridad" routerLinkActive="active" class="nav-link"><span class="nav-icon" aria-hidden="true">S</span>Seguridad</a></li>
        </ul>
      </nav>
      <div class="sidebar-footer"><strong>A la Verdad, por la Fe y la Ciencia</strong><p>UCO · {{ anioVigente }}</p></div>
    </aside>
  `,
  changeDetection: ChangeDetectionStrategy.Eager
})
export class SidebarComponent {
  readonly anioVigente = new Date().getFullYear();
}
