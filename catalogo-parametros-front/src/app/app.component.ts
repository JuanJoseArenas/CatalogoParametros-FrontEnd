import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './layout/components/sidebar/sidebar.component';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet, SidebarComponent],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `
    <div class="app-container">
      <app-sidebar></app-sidebar>
      <div class="main-shell">
        <header class="topbar">
          <div>
            <div class="topbar-label">Universidad Católica de Oriente</div>
            <div class="topbar-context">Plataforma institucional de servicios digitales</div>
          </div>
          <div class="topbar-status">Servicios operativos</div>
        </header>
        <main class="main-content">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `
})
export class AppComponent {
  title = 'Catálogo de Parámetros UCO';
}
