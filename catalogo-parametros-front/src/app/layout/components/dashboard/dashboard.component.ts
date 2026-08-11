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
        <p style="color: #64748b; font-weight: 500;">Bienvenido al sistema de gestion de catalogo de parametros</p>
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
      color: #0f172a;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 20px;
    }

    .stat-card {
      background: white;
      border-radius: 14px;
      padding: 24px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.06);
      display: flex;
      flex-direction: column;
      gap: 14px;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      border: 1px solid #f1f5f9;
    }

    .stat-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04);
    }

    .stat-icon {
      font-size: 2.2rem;
      width: 56px;
      height: 56px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);
      border-radius: 14px;
    }

    .stat-info h3 {
      font-size: 1.05rem;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 4px;
    }

    .stat-info p {
      font-size: 0.85rem;
      color: #64748b;
      font-weight: 500;
    }
  `]
})
export class DashboardComponent {}
