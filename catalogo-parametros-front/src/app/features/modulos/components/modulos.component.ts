import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { SseService } from '../../../core/services/sse.service';
import { Modulo, Aplicacion } from '../../../shared/models';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-modulos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="modulos">
      <div class="page-header">
        <h1>Modulos</h1>
        <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
          <div class="connection-status" [class.connected]="isConnected" [class.disconnected]="!isConnected">
            <span class="status-dot" [class.connected]="isConnected" [class.disconnected]="!isConnected"></span>
            {{ isConnected ? 'En vivo' : 'Desconectado' }}
          </div>
          <div class="search-bar">
            <span class="search-icon">🔍</span>
            <input type="text" placeholder="Buscar modulo..." [(ngModel)]="searchTerm">
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
          <h2 class="card-title">Lista de Modulos</h2>
          <span style="font-size: 0.85rem; color: #64748b; font-weight: 500;">
            {{ filteredModulos.length }} registro(s) en pagina {{ page }}
          </span>
        </div>

        <div class="table-container" *ngIf="filteredModulos.length > 0">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Aplicacion</th>
                <th>Fecha Inicio</th>
                <th>Fecha Fin</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let mod of filteredModulos">
                <td>{{ mod.nombre }}</td>
                <td>{{ getAplicacionNombre(mod.idAplicacion) }}</td>
                <td>{{ mod.fechaInicio || '-' }}</td>
                <td>{{ mod.fechaFinal || '-' }}</td>
                <td>
                  <span class="badge" [class.badge-success]="mod.activo" [class.badge-danger]="!mod.activo">
                    {{ mod.activo ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>
                <td>
                  <button class="btn btn-warning btn-sm" (click)="editModulo(mod)">Editar</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="empty-state" *ngIf="filteredModulos.length === 0 && !loading">
          <div class="empty-state-icon">📦</div>
          <h3>No hay modulos</h3>
          <p>Comienza creando un nuevo modulo</p>
        </div>

        <div class="loading" *ngIf="loading">
          <div class="spinner"></div>
        </div>

        <div class="pagination" *ngIf="!loading && modulos.length > 0">
          <button class="btn btn-secondary btn-sm" (click)="changePage(page - 1)" [disabled]="page <= 1">Anterior</button>
          <span style="font-size: 0.9rem; color: #334155; font-weight: 600;">Página {{ page }}</span>
          <button class="btn btn-secondary btn-sm" (click)="changePage(page + 1)" [disabled]="modulos.length < pageSize">Siguiente</button>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div class="modal-overlay" *ngIf="showModal" (click)="closeModalOnOverlay($event)">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">{{ isEditing ? 'Editar' : 'Nuevo' }} Modulo</h3>
          <button class="modal-close" (click)="closeModal()">&times;</button>
        </div>
        <div class="modal-body">
          <form [formGroup]="moduloForm" (ngSubmit)="saveModulo()">
            <div class="form-group">
              <label class="form-label">Nombre</label>
              <input type="text" class="form-control" formControlName="nombre" placeholder="Nombre del modulo">
            </div>
            <div class="form-group">
              <label class="form-label">Aplicacion</label>
              <select class="form-control" formControlName="idAplicacion">
                <option value="">Seleccione una aplicacion</option>
                <option *ngFor="let app of aplicaciones" [value]="app.id">{{ app.nombre }}</option>
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
          <button class="btn btn-primary" (click)="saveModulo()" [disabled]="moduloForm.invalid || saving">
            {{ saving ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear') }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modulos {
      max-width: 1200px;
      margin: 0 auto;
    }
    .pagination {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 16px 0;
    }
  `]
})
export class ModulosComponent implements OnInit, OnDestroy {
  modulos: Modulo[] = [];
  aplicaciones: Aplicacion[] = [];
  loading = false;
  saving = false;
  showModal = false;
  isEditing = false;
  editingId: string | null = null;
  errorMessage = '';
  successMessage = '';
  moduloForm: FormGroup;
  searchTerm = '';
  isConnected = false;
  page = 1;
  pageSize = 10;
  private subscriptions: Subscription[] = [];

  constructor(private apiService: ApiService, private fb: FormBuilder, private sseService: SseService) {
    this.moduloForm = this.fb.group({
      nombre: ['', Validators.required],
      idAplicacion: ['', Validators.required],
      activo: [true],
      fechaInicio: [''],
      fechaFinal: ['']
    });
  }

  ngOnInit(): void {
    this.loadModulos();
    this.loadAplicaciones();
    this.connectSse();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  get filteredModulos(): Modulo[] {
    if (!this.searchTerm.trim()) return this.modulos;
    return this.modulos.filter(mod =>
      mod.nombre.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  loadModulos(): void {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.apiService.getModulos(this.page, this.pageSize).subscribe({
      next: (data) => {
        this.modulos = data;
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = err.message || 'Error al cargar los modulos';
        this.loading = false;
      }
    });
  }

  changePage(page: number): void {
    if (page < 1 || this.loading) return;
    this.page = page;
    this.loadModulos();
  }

  loadAplicaciones(): void {
    this.apiService.getAllAplicaciones().subscribe({
      next: (data) => {
        this.aplicaciones = data;
      },
      error: (err) => {
        console.error('Error al cargar aplicaciones:', err);
      }
    });
  }

  connectSse(): void {
    const url = `${this.apiService.getBaseUrl()}/modulos/events`;
    const sub = this.sseService.connect(url, 'modulo').subscribe({
      next: (data: any) => {
        this.isConnected = true;
        
        const entity = data.modulo;
        const eventType = data.event;
        
        if (!entity) return;
        
        switch (eventType) {
          case 'CREATED':
            if (!this.modulos.find(m => m.id === entity.id)) {
              this.modulos = [...this.modulos, entity];
            }
            break;
          case 'UPDATED':
            this.modulos = this.modulos.map(m =>
              m.id === entity.id ? entity : m
            );
            break;
          case 'DELETED':
            this.modulos = this.modulos.filter(m => m.id !== entity.id);
            break;
        }
      },
      error: () => {
        this.isConnected = false;
      }
    });
    this.subscriptions.push(sub);
  }

  getAplicacionNombre(id: string): string {
    const app = this.aplicaciones.find(a => a.id === id);
    return app ? app.nombre : 'N/A';
  }

  openModal(): void {
    this.showModal = true;
    this.isEditing = false;
    this.editingId = null;
    this.moduloForm.reset({ nombre: '', idAplicacion: '', activo: true, fechaInicio: '', fechaFinal: '' });
  }

  editModulo(mod: Modulo): void {
    this.showModal = true;
    this.isEditing = true;
    this.editingId = mod.id;
    this.moduloForm.reset({
      nombre: mod.nombre,
      idAplicacion: mod.idAplicacion,
      activo: mod.activo,
      fechaInicio: mod.fechaInicio || '',
      fechaFinal: mod.fechaFinal || ''
    });
  }

  closeModal(): void {
    this.showModal = false;
    this.isEditing = false;
    this.editingId = null;
    this.moduloForm.reset({ nombre: '', idAplicacion: '', activo: true, fechaInicio: '', fechaFinal: '' });
  }

  closeModalOnOverlay(event: Event): void {
    if (event.target === event.currentTarget) {
      this.closeModal();
    }
  }

  saveModulo(): void {
    if (this.moduloForm.invalid) {
      this.errorMessage = 'El nombre y la aplicacion son requeridos';
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const data: any = {
      nombre: this.moduloForm.value.nombre,
      idAplicacion: this.moduloForm.value.idAplicacion,
      activo: this.moduloForm.value.activo
    };

    if (this.moduloForm.value.fechaInicio) {
      data.fechaInicio = `${this.moduloForm.value.fechaInicio} 00:00:00`;
    }
    if (this.moduloForm.value.fechaFinal) {
      data.fechaFinal = `${this.moduloForm.value.fechaFinal} 00:00:00`;
    }

    this.apiService.createModulo(data).subscribe({
      next: (response) => {
        this.successMessage = response.mensajes[0] || 'Modulo creado exitosamente';
        this.saving = false;
        this.closeModal();
      },
      error: (err) => {
        this.errorMessage = err.message || 'Error al crear el modulo';
        this.saving = false;
      }
    });
  }
}
