import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { Organizacion } from '../../../shared/models';

@Component({
  selector: 'app-organizaciones',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="organizaciones">
      <div class="header">
        <h1>Organizaciones</h1>
        <button class="btn btn-primary" (click)="openModal()">+ Nueva Organizacion</button>
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
        </div>

        <div class="table-container" *ngIf="organizaciones.length > 0">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let org of organizaciones">
                <td>{{ org.id | slice:0:8 }}...</td>
                <td>{{ org.nombre }}</td>
                <td>
                  <button class="btn btn-warning btn-sm" (click)="editOrganizacion(org)">Editar</button>
                  <button class="btn btn-danger btn-sm" (click)="deleteOrganizacion(org.id)">Eliminar</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="empty-state" *ngIf="organizaciones.length === 0 && !loading">
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

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .header h1 {
      font-size: 1.75rem;
      font-weight: 700;
      color: #1f2937;
    }
  `]
})
export class OrganizacionesComponent implements OnInit {
  organizaciones: Organizacion[] = [];
  loading = false;
  saving = false;
  showModal = false;
  isEditing = false;
  editingId: string | null = null;
  errorMessage = '';
  successMessage = '';
  organizacionForm: FormGroup;

  constructor(private apiService: ApiService, private fb: FormBuilder) {
    this.organizacionForm = this.fb.group({
      nombre: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadOrganizaciones();
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
          this.loadOrganizaciones();
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
          this.loadOrganizaciones();
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
        this.loadOrganizaciones();
      },
      error: (err) => {
        this.errorMessage = err.message || 'Error al eliminar la organizacion';
      }
    });
  }
}
