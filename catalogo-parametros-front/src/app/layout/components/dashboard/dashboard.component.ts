import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink],
  template: `
    <div class="dashboard">
      <section class="header">
        <div class="eyebrow">Universidad Católica de Oriente · UCO</div>
        <h1>Catálogo de Parámetros</h1>
        <p>Administra la información que articula las aplicaciones, funcionalidades y ambientes de la Universidad.</p>
        <div class="hero-actions">
          <a routerLink="/parametros" class="btn btn-warning">Gestionar parámetros</a>
        </div>
      </section>

      <div class="stats-grid">
        <div class="stat-card"><span class="stat-kicker">03 · ESTRUCTURA</span><div class="stat-icon">O</div><div class="stat-info"><h3>Organizaciones</h3><p>Gestiona las organizaciones que hacen parte del catálogo.</p></div><a routerLink="/organizaciones" class="btn btn-primary">Ver organizaciones</a></div>
        <div class="stat-card"><span class="stat-kicker">04 · ESTRUCTURA</span><div class="stat-icon">A</div><div class="stat-info"><h3>Aplicaciones</h3><p>Administra las aplicaciones consumidoras de la plataforma.</p></div><a routerLink="/aplicaciones" class="btn btn-primary">Ver aplicaciones</a></div>
        <div class="stat-card"><span class="stat-kicker">05 · ESTRUCTURA</span><div class="stat-icon">M</div><div class="stat-info"><h3>Módulos</h3><p>Organiza los módulos funcionales de cada aplicación.</p></div><a routerLink="/modulos" class="btn btn-primary">Ver módulos</a></div>
        <div class="stat-card"><span class="stat-kicker">06 · ESTRUCTURA</span><div class="stat-icon">F</div><div class="stat-info"><h3>Funcionalidades</h3><p>Administra las funcionalidades asociadas a los módulos.</p></div><a routerLink="/funcionalidades" class="btn btn-primary">Ver funcionalidades</a></div>
        <div class="stat-card"><span class="stat-kicker">07 · CONFIGURACIÓN</span><div class="stat-icon">P</div><div class="stat-info"><h3>Parámetros</h3><p>Gestiona los parámetros que consumen las aplicaciones.</p></div><a routerLink="/parametros" class="btn btn-primary">Ver parámetros</a></div>
        <div class="stat-card"><span class="stat-kicker">08 · CONFIGURACIÓN</span><div class="stat-icon">D</div><div class="stat-info"><h3>Metadatos</h3><p>Administra los valores y descripciones asociados a los parámetros.</p></div><a routerLink="/metadatos" class="btn btn-primary">Ver metadatos</a></div>
        <div class="stat-card"><span class="stat-kicker">09 · AMBIENTES</span><div class="stat-icon">E</div><div class="stat-info"><h3>Metadatos por ambiente</h3><p>Relaciona parámetros, ambientes y estados de metadato.</p></div><a routerLink="/metadatos-ambiente" class="btn btn-primary">Ver relaciones</a></div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.Eager
})
export class DashboardComponent {}
