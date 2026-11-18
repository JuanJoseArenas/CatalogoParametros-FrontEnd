import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <aside class="sidebar">
      <div class="sidebar-header">
        <h2>Catálogo de Parámetros</h2>
        <p>Sistema de Gestión v1.0</p>
      </div>
      <nav>
        <ul class="nav-menu">
          <li class="nav-item"><a routerLink="/mensajes" routerLinkActive="active" class="nav-link"><span class="nav-icon" aria-hidden="true">💬</span>Mensajes</a></li>
          <li class="nav-item"><a routerLink="/seguridad" routerLinkActive="active" class="nav-link"><span class="nav-icon" aria-hidden="true">🛡️</span>Seguridad</a></li>
          <li class="nav-item"><a routerLink="/dashboard" routerLinkActive="active" class="nav-link"><span class="nav-icon" aria-hidden="true">📊</span>Dashboard</a></li>
          <li class="nav-item"><a routerLink="/organizaciones" routerLinkActive="active" class="nav-link"><span class="nav-icon" aria-hidden="true">🏢</span>Organizaciones</a></li>
          <li class="nav-item"><a routerLink="/aplicaciones" routerLinkActive="active" class="nav-link"><span class="nav-icon" aria-hidden="true">📱</span>Aplicaciones</a></li>
          <li class="nav-item"><a routerLink="/modulos" routerLinkActive="active" class="nav-link"><span class="nav-icon" aria-hidden="true">📦</span>Módulos</a></li>
          <li class="nav-item"><a routerLink="/funcionalidades" routerLinkActive="active" class="nav-link"><span class="nav-icon" aria-hidden="true">⚙️</span>Funcionalidades</a></li>
          <li class="nav-item"><a routerLink="/parametros" routerLinkActive="active" class="nav-link"><span class="nav-icon" aria-hidden="true">🔧</span>Parámetros</a></li>
          <li class="nav-item"><a routerLink="/metadatos" routerLinkActive="active" class="nav-link"><span class="nav-icon" aria-hidden="true">🧩</span>Metadatos</a></li>
          <li class="nav-item"><a routerLink="/metadatos-ambiente" routerLinkActive="active" class="nav-link"><span class="nav-icon" aria-hidden="true">🔗</span>Metadatos por ambiente</a></li>
          <li class="nav-item"><a routerLink="/tokens" routerLinkActive="active" class="nav-link"><span class="nav-icon" aria-hidden="true">🔑</span>Tokens</a></li>
          <li class="nav-item"><a routerLink="/consulta-parametros" routerLinkActive="active" class="nav-link"><span class="nav-icon" aria-hidden="true">🔎</span>Consulta de parámetros</a></li>
        </ul>
      </nav>
      <div class="sidebar-footer"><p>2026 UCOLab</p></div>
    </aside>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [`
    .sidebar-footer { padding: 16px 24px; border-top: 1px solid rgba(255, 255, 255, 0.08); text-align: center; font-size: .75rem; color: rgba(255, 255, 255, .4); font-weight: 500; }
  `]
})
export class SidebarComponent {}
