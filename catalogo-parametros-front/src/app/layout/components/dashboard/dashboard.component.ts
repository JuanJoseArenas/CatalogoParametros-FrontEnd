import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="dashboard">
      <div class="header">
        <h1>Dashboard</h1>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">🏢</div>
          <div class="stat-info">
            <h3>Organizaciones</h3>
            <p>Gestiona las organizaciones del sistema</p>
          </div>
          <a routerLink="/organizaciones" class="btn btn-primary">Ver</a>
        </div>

        <div class="stat-card">
          <div class="stat-icon">📱</div>
          <div class="stat-info">
            <h3>Aplicaciones</h3>
            <p>Administra las aplicaciones</p>
          </div>
          <a routerLink="/aplicaciones" class="btn btn-primary">Ver</a>
        </div>

        <div class="stat-card">
          <div class="stat-icon">📦</div>
          <div class="stat-info">
            <h3>Modulos</h3>
            <p>Gestiona los modulos de las aplicaciones</p>
          </div>
          <a routerLink="/modulos" class="btn btn-primary">Ver</a>
        </div>

        <div class="stat-card">
          <div class="stat-icon">⚙️</div>
          <div class="stat-info">
            <h3>Funcionalidades</h3>
            <p>Administra las funcionalidades</p>
          </div>
          <a routerLink="/funcionalidades" class="btn btn-primary">Ver</a>
        </div>

        <div class="stat-card">
          <div class="stat-icon">🔧</div>
          <div class="stat-info">
            <h3>Parametros</h3>
            <p>Gestiona los parametros del sistema</p>
          </div>
          <a routerLink="/parametros" class="btn btn-primary">Ver</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard {
      max-width: 1200px;
      margin: 0 auto;
    }

    .header {
      margin-bottom: 32px;
    }

    .header h1 {
      font-size: 2rem;
      font-weight: 700;
      color: #1f2937;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 24px;
    }

    .stat-card {
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      display: flex;
      flex-direction: column;
      gap: 16px;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .stat-icon {
      font-size: 2.5rem;
      width: 60px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f3f4f6;
      border-radius: 12px;
    }

    .stat-info h3 {
      font-size: 1.1rem;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 4px;
    }

    .stat-info p {
      font-size: 0.9rem;
      color: #6b7280;
    }
  `]
})
export class DashboardComponent {}
