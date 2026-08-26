import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { TipoMetadato } from '../../../shared/models';

@Component({
  selector: 'app-tipos-metadato',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="tipos-metadato">
      <div class="page-header">
        <h1>Tipos de Metadato</h1>
        <div class="search-bar">
          <span class="search-icon">🔍</span>
          <input type="text" placeholder="Buscar tipo de metadato..." [(ngModel)]="searchTerm">
        </div>
      </div>

      <div class="card" *ngIf="errorMessage">
        <div class="alert alert-error">{{ errorMessage }}</div>
      </div>

      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Lista de Tipos de Metadato</h2>
          <span class="record-count">{{ filteredTipos.length }} registro(s)</span>
        </div>

        <div class="table-container" *ngIf="filteredTipos.length > 0">
          <table>
            <thead><tr><th>Tipo</th><th>Detalle</th><th>Identificador</th></tr></thead>
            <tbody>
              <tr *ngFor="let tipo of filteredTipos">
                <td>{{ tipo.tipo }}</td>
                <td>{{ tipo.detalle }}</td>
                <td><code>{{ tipo.id }}</code></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="empty-state" *ngIf="filteredTipos.length === 0 && !loading">
          <div class="empty-state-icon">🏷️</div>
          <h3>No hay tipos de metadato</h3>
          <p>No se encontraron registros para mostrar</p>
        </div>
        <div class="loading" *ngIf="loading"><div class="spinner"></div></div>
      </div>
    </div>
  `,
  styles: [`
    .tipos-metadato { max-width: 1200px; margin: 0 auto; }
    .record-count { font-size: .85rem; color: #64748b; font-weight: 500; }
    code { font-size: .8rem; color: #475569; }
  `]
})
export class TiposMetadatoComponent implements OnInit {
  tipos: TipoMetadato[] = [];
  loading = false;
  errorMessage = '';
  searchTerm = '';

  constructor(private apiService: ApiService) {}

  ngOnInit(): void { this.loadTipos(); }

  get filteredTipos(): TipoMetadato[] {
    const term = this.searchTerm.trim().toLowerCase();
    return term
      ? this.tipos.filter(tipo =>
          tipo.tipo.toLowerCase().includes(term) || tipo.detalle.toLowerCase().includes(term)
        )
      : this.tipos;
  }

  loadTipos(): void {
    this.loading = true;
    this.errorMessage = '';
    this.apiService.getTiposMetadato().subscribe({
      next: tipos => { this.tipos = tipos; this.loading = false; },
      error: err => { this.errorMessage = err.message || 'Error al cargar los tipos de metadato'; this.loading = false; }
    });
  }
}
