import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <aside class="sidebar">
      <div class="sidebar-header">
        <h2>Catalogo Parametros</h2>
        <p>Sistema de Gestion v1.0</p>
      </div>
      <nav>
        <ul class="nav-menu">
          <li class="nav-item">
            <a routerLink="/dashboard" routerLinkActive="active" class="nav-link">
              <span class="nav-icon">📊</span>
              Dashboard
            </a>
          </li>
          <li class="nav-item">
            <a routerLink="/organizaciones" routerLinkActive="active" class="nav-link">
              <span class="nav-icon">🏢</span>
              Organizaciones
            </a>
          </li>
          <li class="nav-item">
            <a routerLink="/aplicaciones" routerLinkActive="active" class="nav-link">
              <span class="nav-icon">📱</span>
              Aplicaciones
            </a>
          </li>
          <li class="nav-item">
            <a routerLink="/modulos" routerLinkActive="active" class="nav-link">
              <span class="nav-icon">📦</span>
              Modulos
            </a>
          </li>
          <li class="nav-item">
            <a routerLink="/funcionalidades" routerLinkActive="active" class="nav-link">
              <span class="nav-icon">⚙️</span>
              Funcionalidades
            </a>
          </li>
          <li class="nav-item">
            <a routerLink="/parametros" routerLinkActive="active" class="nav-link">
              <span class="nav-icon">🔧</span>
              Parametros
            </a>
          </li>
        </ul>
      </nav>
      <div class="sidebar-footer">
        <p>2026 UCOLab</p>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar-footer {
      padding: 16px 24px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      text-align: center;
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.4);
      font-weight: 500;
    }
  `]
})
export class SidebarComponent {}
