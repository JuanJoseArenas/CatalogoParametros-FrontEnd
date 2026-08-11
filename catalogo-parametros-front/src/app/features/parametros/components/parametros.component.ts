import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { Parametro, Funcionalidad } from '../../../shared/models';

@Component({
  selector: 'app-parametros',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="parametros">
      <div class="header">
        <h1>Parametros</h1>
        <button class="btn btn-primary" (click)="openModal()">+ Nuevo Parametro</button>
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
        </div>

        <div class="table-container" *ngIf="parametros.length > 0">
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
              <tr *ngFor="let param of parametros">
                <td>{{ param.id | slice:0:8 }}...</td>
                <td>{{ param.nombre }}</td>
                <td>{{ getFuncionalidadNombre(param.idFuncionalidad) }}</td>
                <td>{{ param.idTipoParametro | slice:0:8 }}...</td>
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

        <div class="empty-state" *ngIf="parametros.length === 0 && !loading">
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
export class ParametrosComponent implements OnInit {
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

  constructor(private apiService: ApiService, private fb: FormBuilder) {
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
          this.loadParametros();
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
          this.loadParametros();
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
        this.loadParametros();
      },
      error: (err) => {
        this.errorMessage = err.message || 'Error al eliminar el parametro';
      }
    });
  }
}
