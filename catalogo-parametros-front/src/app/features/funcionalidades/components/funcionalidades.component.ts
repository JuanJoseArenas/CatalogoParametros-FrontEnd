import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { SseService } from '../../../core/services/sse.service';
import { Funcionalidad, Modulo } from '../../../shared/models';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-funcionalidades',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="funcionalidades">
      <div class="page-header">
        <h1>Funcionalidades</h1>
        <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
          <div class="connection-status" [class.connected]="isConnected" [class.disconnected]="!isConnected">
            <span class="status-dot" [class.connected]="isConnected" [class.disconnected]="!isConnected"></span>
            {{ isConnected ? 'En vivo' : 'Desconectado' }}
          </div>
          <div class="search-bar">
            <span class="search-icon">🔍</span>
            <input type="text" placeholder="Buscar funcionalidad..." [(ngModel)]="searchTerm">
          </div>
          <button class="btn btn-primary" (click)="openModal()">+ Nueva</button>
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
          <h2 class="card-title">Lista de Funcionalidades</h2>
          <span style="font-size: 0.85rem; color: #64748b; font-weight: 500;">
            {{ filteredFuncionalidades.length }} registro(s)
          </span>
        </div>

        <div class="table-container" *ngIf="filteredFuncionalidades.length > 0">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Modulo</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let func of filteredFuncionalidades">
                <td>{{ func.nombre }}</td>
                <td>{{ getModuloNombre(func.idModulo) }}</td>
                <td>
                  <span class="badge" [class.badge-success]="func.activo" [class.badge-danger]="!func.activo">
                    {{ func.activo ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>
                <td>
                  <button class="btn btn-warning btn-sm" (click)="editFuncionalidad(func)">Editar</button>
                  <button class="btn btn-danger btn-sm" (click)="deleteFuncionalidad(func.id)">Eliminar</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="empty-state" *ngIf="filteredFuncionalidades.length === 0 && !loading">
          <div class="empty-state-icon">⚙️</div>
          <h3>No hay funcionalidades</h3>
          <p>Comienza creando una nueva funcionalidad</p>
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
          <h3 class="modal-title">{{ isEditing ? 'Editar' : 'Nueva' }} Funcionalidad</h3>
          <button class="modal-close" (click)="closeModal()">&times;</button>
        </div>
        <div class="modal-body">
          <form [formGroup]="funcionalidadForm" (ngSubmit)="saveFuncionalidad()">
            <div class="form-group">
              <label class="form-label">Nombre</label>
              <input type="text" class="form-control" formControlName="nombre" placeholder="Nombre de la funcionalidad">
            </div>
            <div class="form-group">
              <label class="form-label">Modulo</label>
              <select class="form-control" formControlName="idModulo">
                <option value="">Seleccione un modulo</option>
                <option *ngFor="let mod of modulos" [value]="mod.id">{{ mod.nombre }}</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Fecha Inicio</label>
              <input type="date" class="form-control" formControlName="fechaInicio">
            </div>
            <div class="form-group">
              <label class="form-label">Fecha Fin</label>
              <input type="date" class="form-control" formControlName="fechaFinal">
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
          <button class="btn btn-primary" (click)="saveFuncionalidad()" [disabled]="funcionalidadForm.invalid || saving">
            {{ saving ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear') }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .funcionalidades {
      max-width: 1200px;
      margin: 0 auto;
    }
  `]
})
export class FuncionalidadesComponent implements OnInit, OnDestroy {
  funcionalidades: Funcionalidad[] = [];
  modulos: Modulo[] = [];
  loading = false;
  saving = false;
  showModal = false;
  isEditing = false;
  editingId: string | null = null;
  errorMessage = '';
  successMessage = '';
  funcionalidadForm: FormGroup;
  searchTerm = '';
  isConnected = false;
  private subscriptions: Subscription[] = [];

  constructor(private apiService: ApiService, private fb: FormBuilder, private sseService: SseService) {
    this.funcionalidadForm = this.fb.group({
      nombre: ['', Validators.required],
      idModulo: ['', Validators.required],
      activo: [true],
      fechaInicio: ['', Validators.required],
      fechaFinal: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadFuncionalidades();
    this.loadModulos();
    this.connectSse();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  get filteredFuncionalidades(): Funcionalidad[] {
    if (!this.searchTerm.trim()) return this.funcionalidades;
    return this.funcionalidades.filter(func =>
      func.nombre.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  loadFuncionalidades(): void {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.apiService.getFuncionalidades().subscribe({
      next: (data) => {
        this.funcionalidades = data;
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = err.message || 'Error al cargar las funcionalidades';
        this.loading = false;
      }
    });
  }

  loadModulos(): void {
    this.apiService.getModulos().subscribe({
      next: (data) => {
        this.modulos = data;
      },
      error: (err) => {
        console.error('Error al cargar modulos:', err);
      }
    });
  }

  connectSse(): void {
    const url = `${this.apiService.getBaseUrl()}/funcionalidades/events`;
    const sub = this.sseService.connect(url, 'funcionalidad').subscribe({
      next: (data: any) => {
        this.isConnected = true;
        
        const entity = data.funcionalidad;
        const eventType = data.event;
        
        if (!entity) return;
        
        switch (eventType) {
          case 'CREATED':
            if (!this.funcionalidades.find(f => f.id === entity.id)) {
              this.funcionalidades = [...this.funcionalidades, entity];
            }
            break;
          case 'UPDATED':
            this.funcionalidades = this.funcionalidades.map(f =>
              f.id === entity.id ? entity : f
            );
            break;
          case 'DELETED':
            this.funcionalidades = this.funcionalidades.filter(f => f.id !== entity.id);
            break;
        }
      },
      error: () => {
        this.isConnected = false;
      }
    });
    this.subscriptions.push(sub);
  }

  getModuloNombre(id: string): string {
    const mod = this.modulos.find(m => m.id === id);
    return mod ? mod.nombre : 'N/A';
  }

  openModal(): void {
    this.showModal = true;
    this.isEditing = false;
    this.editingId = null;
    this.funcionalidadForm.reset({ nombre: '', idModulo: '', activo: true, fechaInicio: '', fechaFinal: '' });
  }

  editFuncionalidad(func: Funcionalidad): void {
    this.showModal = true;
    this.isEditing = true;
    this.editingId = func.id;
    this.funcionalidadForm.reset({
      nombre: func.nombre,
      idModulo: func.idModulo,
      activo: func.activo,
      fechaInicio: func.fechaInicio || '',
      fechaFinal: func.fechaFinal || ''
    });
  }

  closeModal(): void {
    this.showModal = false;
    this.isEditing = false;
    this.editingId = null;
    this.funcionalidadForm.reset({ nombre: '', idModulo: '', activo: true, fechaInicio: '', fechaFinal: '' });
  }

  closeModalOnOverlay(event: Event): void {
    if (event.target === event.currentTarget) {
      this.closeModal();
    }
  }

  saveFuncionalidad(): void {
    if (this.funcionalidadForm.invalid) {
      this.errorMessage = 'El nombre, modulo, fecha inicio y fecha fin son requeridos';
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const data: any = {
      nombre: this.funcionalidadForm.value.nombre,
      idModulo: this.funcionalidadForm.value.idModulo,
      activo: this.funcionalidadForm.value.activo
    };

    if (this.funcionalidadForm.value.fechaInicio) {
      data.fechaInicio = `${this.funcionalidadForm.value.fechaInicio} 00:00:00`;
    }
    if (this.funcionalidadForm.value.fechaFinal) {
      data.fechaFinal = `${this.funcionalidadForm.value.fechaFinal} 00:00:00`;
    }

    if (this.isEditing && this.editingId) {
      this.apiService.updateFuncionalidad(this.editingId, data).subscribe({
        next: (response) => {
          this.successMessage = response.mensajes[0] || 'Funcionalidad actualizada exitosamente';
          this.saving = false;
          this.closeModal();
        },
        error: (err) => {
          this.errorMessage = err.message || 'Error al actualizar la funcionalidad';
          this.saving = false;
        }
      });
    } else {
      this.apiService.createFuncionalidad(data).subscribe({
        next: (response) => {
          this.successMessage = response.mensajes[0] || 'Funcionalidad creada exitosamente';
          this.saving = false;
          this.closeModal();
        },
        error: (err) => {
          this.errorMessage = err.message || 'Error al crear la funcionalidad';
          this.saving = false;
        }
      });
    }
  }

  deleteFuncionalidad(id: string): void {
    if (!confirm('¿Esta seguro de eliminar esta funcionalidad?')) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    this.apiService.deleteFuncionalidad(id).subscribe({
      next: (response) => {
        this.successMessage = response.mensajes[0] || 'Funcionalidad eliminada exitosamente';
        this.errorMessage = '';
      },
      error: (err) => {
        this.errorMessage = err.message || 'Error al eliminar la funcionalidad';
      }
    });
  }
}
