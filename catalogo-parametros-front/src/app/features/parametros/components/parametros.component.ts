import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { SseService } from '../../../core/services/sse.service';
import { Parametro, Funcionalidad } from '../../../shared/models';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-parametros',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="parametros">
      <div class="page-header">
        <h1>Parametros</h1>
        <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
          <div class="connection-status" [class.connected]="isConnected" [class.disconnected]="!isConnected">
            <span class="status-dot" [class.connected]="isConnected" [class.disconnected]="!isConnected"></span>
            {{ isConnected ? 'En vivo' : 'Desconectado' }}
          </div>
          <div class="search-bar">
            <span class="search-icon">🔍</span>
            <input type="text" placeholder="Buscar parametro..." [(ngModel)]="searchTerm">
          </div>
          <button class="btn btn-primary" (click)="openModal()">+ Nuevo</button>
        </div>
      </div>

      <div class="card" *ngIf="errorMessage">
        <div class="alert alert-error">{{ errorMessage }}</div>
      </div>

      <div class="card" *ngIf="successMessage">
        <div class="alert alert-success">{{ successMessage }}</div>
      </div>

      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Lista de Parametros</h2>
          <span style="font-size: 0.85rem; color: #64748b; font-weight: 500;">
            {{ filteredParametros.length }} registro(s)
          </span>
        </div>

        <div class="table-container" *ngIf="filteredParametros.length > 0">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Funcionalidad</th>
                <th>Tipo Parametro</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let param of filteredParametros">
                <td><code>{{ param.id }}</code></td>
                <td>{{ param.nombre }}</td>
                <td>{{ getFuncionalidadNombre(param.idFuncionalidad) }}</td>
                <td><code>{{ param.idTipoParametro }}</code></td>
                <td>
                  <span class="badge" [class.badge-success]="param.activo" [class.badge-danger]="!param.activo">
                    {{ param.activo ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>
                <td>
                  <button class="btn btn-warning btn-sm" (click)="editParametro(param)">Editar</button>
                  <button class="btn btn-danger btn-sm" (click)="deleteParametro(param.id)">Eliminar</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="empty-state" *ngIf="filteredParametros.length === 0 && !loading">
          <div class="empty-state-icon">🔧</div>
          <h3>No hay parametros</h3>
          <p>Comienza creando un nuevo parametro</p>
        </div>

        <div class="loading" *ngIf="loading">
          <div class="spinner"></div>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div class="modal-overlay" *ngIf="showModal" (click)="closeModalOnOverlay($event)">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">{{ isEditing ? 'Editar' : 'Nuevo' }} Parametro</h3>
          <button class="modal-close" (click)="closeModal()">&times;</button>
        </div>
        <div class="modal-body">
          <form [formGroup]="parametroForm" (ngSubmit)="saveParametro()">
            <div class="form-group">
              <label class="form-label">Nombre</label>
              <input type="text" class="form-control" formControlName="nombre" placeholder="Nombre del parametro">
            </div>
            <div class="form-group">
              <label class="form-label">Funcionalidad</label>
              <select class="form-control" formControlName="idFuncionalidad">
                <option value="">Seleccione una funcionalidad</option>
                <option *ngFor="let func of funcionalidades" [value]="func.id">{{ func.nombre }}</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">ID Tipo Parametro</label>
              <input type="text" class="form-control" formControlName="idTipoParametro" placeholder="ID del tipo de parametro">
            </div>
            <div class="form-group">
              <label class="form-label">Estado</label>
              <select class="form-control" formControlName="activo">
                <option [value]="true">Activo</option>
                <option [value]="false">Inactivo</option>
              </select>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="closeModal()">Cancelar</button>
          <button class="btn btn-primary" (click)="saveParametro()" [disabled]="parametroForm.invalid || saving">
            {{ saving ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear') }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .parametros {
      max-width: 1200px;
      margin: 0 auto;
    }
  `]
})
export class ParametrosComponent implements OnInit, OnDestroy {
  parametros: Parametro[] = [];
  funcionalidades: Funcionalidad[] = [];
  loading = false;
  saving = false;
  showModal = false;
  isEditing = false;
  editingId: string | null = null;
  errorMessage = '';
  successMessage = '';
  parametroForm: FormGroup;
  searchTerm = '';
  isConnected = false;
  private subscriptions: Subscription[] = [];

  constructor(private apiService: ApiService, private fb: FormBuilder, private sseService: SseService) {
    this.parametroForm = this.fb.group({
      nombre: ['', Validators.required],
      idFuncionalidad: ['', Validators.required],
      idTipoParametro: ['', Validators.required],
      activo: [true]
    });
  }

  ngOnInit(): void {
    this.loadParametros();
    this.loadFuncionalidades();
    this.connectSse();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  get filteredParametros(): Parametro[] {
    if (!this.searchTerm.trim()) return this.parametros;
    return this.parametros.filter(param =>
      param.nombre.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  loadParametros(): void {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.apiService.getParametros().subscribe({
      next: (data) => {
        this.parametros = data;
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = err.message || 'Error al cargar los parametros';
        this.loading = false;
      }
    });
  }

  loadFuncionalidades(): void {
    this.apiService.getFuncionalidades().subscribe({
      next: (data) => {
        this.funcionalidades = data;
      },
      error: (err) => {
        console.error('Error al cargar funcionalidades:', err);
      }
    });
  }

  connectSse(): void {
    const url = `${this.apiService.getBaseUrl()}/parametros/events`;
    const sub = this.sseService.connect(url, 'parametro').subscribe({
      next: (data: any) => {
        this.isConnected = true;
        
        const entity = data.parametro;
        const eventType = data.event;
        
        if (!entity) return;
        
        switch (eventType) {
          case 'CREATED':
            if (!this.parametros.find(p => p.id === entity.id)) {
              this.parametros = [...this.parametros, entity];
            }
            break;
          case 'UPDATED':
            this.parametros = this.parametros.map(p =>
              p.id === entity.id ? entity : p
            );
            break;
          case 'DELETED':
            this.parametros = this.parametros.filter(p => p.id !== entity.id);
            break;
        }
      },
      error: () => {
        this.isConnected = false;
      }
    });
    this.subscriptions.push(sub);
  }

  getFuncionalidadNombre(id: string): string {
    const func = this.funcionalidades.find(f => f.id === id);
    return func ? func.nombre : 'N/A';
  }

  openModal(): void {
    this.showModal = true;
    this.isEditing = false;
    this.editingId = null;
    this.parametroForm.reset({ nombre: '', idFuncionalidad: '', idTipoParametro: '', activo: true });
  }

  editParametro(param: Parametro): void {
    this.showModal = true;
    this.isEditing = true;
    this.editingId = param.id;
    this.parametroForm.reset({
      nombre: param.nombre,
      idFuncionalidad: param.idFuncionalidad,
      idTipoParametro: param.idTipoParametro,
      activo: param.activo
    });
  }

  closeModal(): void {
    this.showModal = false;
    this.isEditing = false;
    this.editingId = null;
    this.parametroForm.reset({ nombre: '', idFuncionalidad: '', idTipoParametro: '', activo: true });
  }

  closeModalOnOverlay(event: Event): void {
    if (event.target === event.currentTarget) {
      this.closeModal();
    }
  }

  saveParametro(): void {
    if (this.parametroForm.invalid) {
      this.errorMessage = 'Todos los campos son requeridos';
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const data = {
      nombre: this.parametroForm.value.nombre,
      idFuncionalidad: this.parametroForm.value.idFuncionalidad,
      idTipoParametro: this.parametroForm.value.idTipoParametro,
      activo: this.parametroForm.value.activo
    };

    if (this.isEditing && this.editingId) {
      this.apiService.updateParametro(this.editingId, data).subscribe({
        next: (response) => {
          this.successMessage = response.mensajes[0] || 'Parametro actualizado exitosamente';
          this.saving = false;
          this.closeModal();
        },
        error: (err) => {
          this.errorMessage = err.message || 'Error al actualizar el parametro';
          this.saving = false;
        }
      });
    } else {
      this.apiService.createParametro(data).subscribe({
        next: (response) => {
          this.successMessage = response.mensajes[0] || 'Parametro creado exitosamente';
          this.saving = false;
          this.closeModal();
        },
        error: (err) => {
          this.errorMessage = err.message || 'Error al crear el parametro';
          this.saving = false;
        }
      });
    }
  }

  deleteParametro(id: string): void {
    if (!confirm('¿Esta seguro de eliminar este parametro?')) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    this.apiService.deleteParametro(id).subscribe({
      next: (response) => {
        this.successMessage = response.mensajes[0] || 'Parametro eliminado exitosamente';
        this.parametros = this.parametros.filter(p => p.id !== id);
      },
      error: (err) => {
        this.errorMessage = err.message || 'Error al eliminar el parametro';
      }
    });
  }
}
