import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { Funcionalidad, Modulo } from '../../../shared/models';

@Component({
  selector: 'app-funcionalidades',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="funcionalidades">
      <div class="header">
        <h1>Funcionalidades</h1>
        <button class="btn btn-primary" (click)="openModal()">+ Nueva Funcionalidad</button>
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
        </div>

        <div class="table-container" *ngIf="funcionalidades.length > 0">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Modulo</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let func of funcionalidades">
                <td>{{ func.id | slice:0:8 }}...</td>
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

        <div class="empty-state" *ngIf="funcionalidades.length === 0 && !loading">
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
export class FuncionalidadesComponent implements OnInit {
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

  constructor(private apiService: ApiService, private fb: FormBuilder) {
    this.funcionalidadForm = this.fb.group({
      nombre: ['', Validators.required],
      idModulo: ['', Validators.required],
      activo: [true]
    });
  }

  ngOnInit(): void {
    this.loadFuncionalidades();
    this.loadModulos();
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

  getModuloNombre(id: string): string {
    const mod = this.modulos.find(m => m.id === id);
    return mod ? mod.nombre : 'N/A';
  }

  openModal(): void {
    this.showModal = true;
    this.isEditing = false;
    this.editingId = null;
    this.funcionalidadForm.reset({ nombre: '', idModulo: '', activo: true });
  }

  editFuncionalidad(func: Funcionalidad): void {
    this.showModal = true;
    this.isEditing = true;
    this.editingId = func.id;
    this.funcionalidadForm.reset({
      nombre: func.nombre,
      idModulo: func.idModulo,
      activo: func.activo
    });
  }

  closeModal(): void {
    this.showModal = false;
    this.isEditing = false;
    this.editingId = null;
    this.funcionalidadForm.reset({ nombre: '', idModulo: '', activo: true });
  }

  closeModalOnOverlay(event: Event): void {
    if (event.target === event.currentTarget) {
      this.closeModal();
    }
  }

  saveFuncionalidad(): void {
    if (this.funcionalidadForm.invalid) {
      this.errorMessage = 'El nombre y el modulo son requeridos';
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const data = {
      nombre: this.funcionalidadForm.value.nombre,
      idModulo: this.funcionalidadForm.value.idModulo,
      activo: this.funcionalidadForm.value.activo
    };

    if (this.isEditing && this.editingId) {
      this.apiService.updateFuncionalidad(this.editingId, data).subscribe({
        next: (response) => {
          this.successMessage = response.mensajes[0] || 'Funcionalidad actualizada exitosamente';
          this.saving = false;
          this.closeModal();
          this.loadFuncionalidades();
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
          this.loadFuncionalidades();
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
        this.loadFuncionalidades();
      },
      error: (err) => {
        this.errorMessage = err.message || 'Error al eliminar la funcionalidad';
      }
    });
  }
}
