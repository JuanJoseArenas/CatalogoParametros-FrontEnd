import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { SseService } from '../../../core/services/sse.service';
import { Organizacion } from '../../../shared/models';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-organizaciones',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="organizaciones">
      <div class="page-header">
        <h1>Organizaciones</h1>
        <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
          <div class="connection-status" [class.connected]="isConnected" [class.disconnected]="!isConnected">
            <span class="status-dot" [class.connected]="isConnected" [class.disconnected]="!isConnected"></span>
            {{ isConnected ? 'En vivo' : 'Desconectado' }}
          </div>
          <div class="search-bar">
            <span class="search-icon">🔍</span>
            <input type="text" placeholder="Buscar organizacion..." [(ngModel)]="searchTerm">
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
          <h2 class="card-title">Lista de Organizaciones</h2>
          <span style="font-size: 0.85rem; color: #64748b; font-weight: 500;">
            {{ filteredOrganizaciones.length }} registro(s)
          </span>
        </div>

        <div class="table-container" *ngIf="filteredOrganizaciones.length > 0">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let org of filteredOrganizaciones">
                <td>{{ org.nombre }}</td>
                <td>
                  <button class="btn btn-warning btn-sm" (click)="editOrganizacion(org)">Editar</button>
                  <button class="btn btn-danger btn-sm" (click)="deleteOrganizacion(org.id)">Eliminar</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="empty-state" *ngIf="filteredOrganizaciones.length === 0 && !loading">
          <div class="empty-state-icon">🏢</div>
          <h3>No hay organizaciones</h3>
          <p>Comienza creando una nueva organizacion</p>
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
          <h3 class="modal-title">{{ isEditing ? 'Editar' : 'Nueva' }} Organizacion</h3>
          <button class="modal-close" (click)="closeModal()">&times;</button>
        </div>
        <div class="modal-body">
          <form [formGroup]="organizacionForm" (ngSubmit)="saveOrganizacion()">
            <div class="form-group">
              <label class="form-label">Nombre</label>
              <input type="text" class="form-control" formControlName="nombre" placeholder="Nombre de la organizacion">
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="closeModal()">Cancelar</button>
          <button class="btn btn-primary" (click)="saveOrganizacion()" [disabled]="organizacionForm.invalid || saving">
            {{ saving ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear') }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .organizaciones {
      max-width: 1200px;
      margin: 0 auto;
    }
  `]
})
export class OrganizacionesComponent implements OnInit, OnDestroy {
  organizaciones: Organizacion[] = [];
  loading = false;
  saving = false;
  showModal = false;
  isEditing = false;
  editingId: string | null = null;
  errorMessage = '';
  successMessage = '';
  organizacionForm: FormGroup;
  searchTerm = '';
  isConnected = false;
  private subscriptions: Subscription[] = [];

  constructor(private apiService: ApiService, private fb: FormBuilder, private sseService: SseService) {
    this.organizacionForm = this.fb.group({
      nombre: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadOrganizaciones();
    this.connectSse();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  get filteredOrganizaciones(): Organizacion[] {
    if (!this.searchTerm.trim()) return this.organizaciones;
    return this.organizaciones.filter(org =>
      org.nombre.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  loadOrganizaciones(): void {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.apiService.getOrganizaciones().subscribe({
      next: (data) => {
        this.organizaciones = data;
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = err.message || 'Error al cargar las organizaciones';
        this.loading = false;
      }
    });
  }

  connectSse(): void {
    const url = `${this.apiService.getBaseUrl()}/organizaciones/events`;
    const sub = this.sseService.connect(url, 'organizacion').subscribe({
      next: (data: any) => {
        this.isConnected = true;
        
        const entity = data.organizacion;
        const eventType = data.event;
        
        if (!entity) return;
        
        switch (eventType) {
          case 'CREATED':
            if (!this.organizaciones.find(o => o.id === entity.id)) {
              this.organizaciones = [...this.organizaciones, entity];
            }
            break;
          case 'UPDATED':
            this.organizaciones = this.organizaciones.map(o =>
              o.id === entity.id ? entity : o
            );
            break;
          case 'DELETED':
            this.organizaciones = this.organizaciones.filter(o => o.id !== entity.id);
            break;
        }
      },
      error: () => {
        this.isConnected = false;
      }
    });
    this.subscriptions.push(sub);
  }

  openModal(): void {
    this.showModal = true;
    this.isEditing = false;
    this.editingId = null;
    this.organizacionForm.reset({ nombre: '' });
  }

  editOrganizacion(org: Organizacion): void {
    this.showModal = true;
    this.isEditing = true;
    this.editingId = org.id;
    this.organizacionForm.reset({ nombre: org.nombre });
  }

  closeModal(): void {
    this.showModal = false;
    this.isEditing = false;
    this.editingId = null;
    this.organizacionForm.reset({ nombre: '' });
  }

  closeModalOnOverlay(event: Event): void {
    if (event.target === event.currentTarget) {
      this.closeModal();
    }
  }

  saveOrganizacion(): void {
    if (this.organizacionForm.invalid) {
      this.errorMessage = 'El nombre es requerido';
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const data = { nombre: this.organizacionForm.value.nombre };

    if (this.isEditing && this.editingId) {
      this.apiService.updateOrganizacion(this.editingId, data).subscribe({
        next: (response) => {
          this.successMessage = response.mensajes[0] || 'Organizacion actualizada exitosamente';
          this.saving = false;
          this.closeModal();
        },
        error: (err) => {
          this.errorMessage = err.message || 'Error al actualizar la organizacion';
          this.saving = false;
        }
      });
    } else {
      this.apiService.createOrganizacion(data).subscribe({
        next: (response) => {
          this.successMessage = response.mensajes[0] || 'Organizacion creada exitosamente';
          this.saving = false;
          this.closeModal();
        },
        error: (err) => {
          this.errorMessage = err.message || 'Error al crear la organizacion';
          this.saving = false;
        }
      });
    }
  }

  deleteOrganizacion(id: string): void {
    if (!confirm('¿Esta seguro de eliminar esta organizacion?')) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    this.apiService.deleteOrganizacion(id).subscribe({
      next: (response) => {
        this.successMessage = response.mensajes[0] || 'Organizacion eliminada exitosamente';
        this.errorMessage = '';
      },
      error: (err) => {
        this.errorMessage = err.message || 'Error al eliminar la organizacion';
      }
    });
  }
}
