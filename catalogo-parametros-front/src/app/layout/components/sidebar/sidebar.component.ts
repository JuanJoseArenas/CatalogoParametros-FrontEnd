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
        <p>Sistema de Gestion</p>
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
    </aside>
  `
})
export class SidebarComponent {}
