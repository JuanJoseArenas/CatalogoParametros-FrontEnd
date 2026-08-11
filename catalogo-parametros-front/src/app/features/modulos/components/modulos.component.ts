import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { Modulo, Aplicacion } from '../../../shared/models';

@Component({
  selector: 'app-modulos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="modulos">
      <div class="header">
        <h1>Modulos</h1>
        <button class="btn btn-primary" (click)="openModal()">+ Nuevo Modulo</button>
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
        </div>

        <div class="table-container" *ngIf="modulos.length > 0">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Aplicacion</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let mod of modulos">
                <td>{{ mod.id | slice:0:8 }}...</td>
                <td>{{ mod.nombre }}</td>
                <td>{{ getAplicacionNombre(mod.idAplicacion) }}</td>
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

        <div class="empty-state" *ngIf="modulos.length === 0 && !loading">
          <div class="empty-state-icon">📦</div>
          <h3>No hay modulos</h3>
          <p>Comienza creando un nuevo modulo</p>
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
export class ModulosComponent implements OnInit {
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

  constructor(private apiService: ApiService, private fb: FormBuilder) {
    this.moduloForm = this.fb.group({
      nombre: ['', Validators.required],
      idAplicacion: ['', Validators.required],
      activo: [true]
    });
  }

  ngOnInit(): void {
    this.loadModulos();
    this.loadAplicaciones();
  }

  loadModulos(): void {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.apiService.getModulos().subscribe({
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

  loadAplicaciones(): void {
    this.apiService.getAplicaciones().subscribe({
      next: (data) => {
        this.aplicaciones = data;
      },
      error: (err) => {
        console.error('Error al cargar aplicaciones:', err);
      }
    });
  }

  getAplicacionNombre(id: string): string {
    const app = this.aplicaciones.find(a => a.id === id);
    return app ? app.nombre : 'N/A';
  }

  openModal(): void {
    this.showModal = true;
    this.isEditing = false;
    this.editingId = null;
    this.moduloForm.reset({ nombre: '', idAplicacion: '', activo: true });
  }

  editModulo(mod: Modulo): void {
    this.showModal = true;
    this.isEditing = true;
    this.editingId = mod.id;
    this.moduloForm.reset({
      nombre: mod.nombre,
      idAplicacion: mod.idAplicacion,
      activo: mod.activo
    });
  }

  closeModal(): void {
    this.showModal = false;
    this.isEditing = false;
    this.editingId = null;
    this.moduloForm.reset({ nombre: '', idAplicacion: '', activo: true });
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

    const data = {
      nombre: this.moduloForm.value.nombre,
      idAplicacion: this.moduloForm.value.idAplicacion,
      activo: this.moduloForm.value.activo
    };

    this.apiService.createModulo(data).subscribe({
      next: (response) => {
        this.successMessage = response.mensajes[0] || 'Modulo creado exitosamente';
        this.saving = false;
        this.closeModal();
        this.loadModulos();
      },
      error: (err) => {
        this.errorMessage = err.message || 'Error al crear el modulo';
        this.saving = false;
      }
    });
  }
}
