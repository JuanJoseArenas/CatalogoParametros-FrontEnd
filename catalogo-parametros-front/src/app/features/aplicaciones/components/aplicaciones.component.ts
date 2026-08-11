import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { Aplicacion, Organizacion } from '../../../shared/models';

@Component({
  selector: 'app-aplicaciones',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="aplicaciones">
      <div class="header">
        <h1>Aplicaciones</h1>
        <button class="btn btn-primary" (click)="openModal()">+ Nueva Aplicacion</button>
      </div>

      <div class="card" *ngIf="errorMessage">
        <div class="alert alert-error">{{ errorMessage }}</div>
      </div>

      <div class="card" *ngIf="successMessage">
        <div class="alert alert-success">{{ successMessage }}</div>
      </div>

      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Lista de Aplicaciones</h2>
        </div>

        <div class="table-container" *ngIf="aplicaciones.length > 0">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Organizacion</th>
                <th>Fecha Inicio</th>
                <th>Fecha Fin</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let app of aplicaciones">
                <td>{{ app.id | slice:0:8 }}...</td>
                <td>{{ app.nombre }}</td>
                <td>{{ getOrganizacionNombre(app.idOrganizacion) }}</td>
                <td>{{ app.fechaInicio || '-' }}</td>
                <td>{{ app.fechaFinal || '-' }}</td>
                <td>
                  <span class="badge" [class.badge-success]="app.activa" [class.badge-danger]="!app.activa">
                    {{ app.activa ? 'Activa' : 'Inactiva' }}
                  </span>
                </td>
                <td>
                  <button class="btn btn-warning btn-sm" (click)="editAplicacion(app)">Editar</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="empty-state" *ngIf="aplicaciones.length === 0 && !loading">
          <div class="empty-state-icon">📱</div>
          <h3>No hay aplicaciones</h3>
          <p>Comienza creando una nueva aplicacion</p>
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
          <h3 class="modal-title">{{ isEditing ? 'Editar' : 'Nueva' }} Aplicacion</h3>
          <button class="modal-close" (click)="closeModal()">&times;</button>
        </div>
        <div class="modal-body">
          <form [formGroup]="aplicacionForm" (ngSubmit)="saveAplicacion()">
            <div class="form-group">
              <label class="form-label">Nombre</label>
              <input type="text" class="form-control" formControlName="nombre" placeholder="Nombre de la aplicacion">
            </div>
            <div class="form-group">
              <label class="form-label">Organizacion</label>
              <select class="form-control" formControlName="idOrganizacion">
                <option value="">Seleccione una organizacion</option>
                <option *ngFor="let org of organizaciones" [value]="org.id">{{ org.nombre }}</option>
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
              <select class="form-control" formControlName="activa">
                <option [value]="true">Activa</option>
                <option [value]="false">Inactiva</option>
              </select>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="closeModal()">Cancelar</button>
          <button class="btn btn-primary" (click)="saveAplicacion()" [disabled]="aplicacionForm.invalid || saving">
            {{ saving ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear') }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .aplicaciones {
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
export class AplicacionesComponent implements OnInit {
  aplicaciones: Aplicacion[] = [];
  organizaciones: Organizacion[] = [];
  loading = false;
  saving = false;
  showModal = false;
  isEditing = false;
  editingId: string | null = null;
  errorMessage = '';
  successMessage = '';
  aplicacionForm: FormGroup;

  constructor(private apiService: ApiService, private fb: FormBuilder) {
    this.aplicacionForm = this.fb.group({
      nombre: ['', Validators.required],
      idOrganizacion: ['', Validators.required],
      activa: [true],
      fechaInicio: [''],
      fechaFinal: ['']
    });
  }

  ngOnInit(): void {
    this.loadAplicaciones();
    this.loadOrganizaciones();
  }

  loadAplicaciones(): void {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.apiService.getAplicaciones().subscribe({
      next: (data) => {
        this.aplicaciones = data;
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = err.message || 'Error al cargar las aplicaciones';
        this.loading = false;
      }
    });
  }

  loadOrganizaciones(): void {
    this.apiService.getOrganizaciones().subscribe({
      next: (data) => {
        this.organizaciones = data;
      },
      error: (err) => {
        console.error('Error al cargar organizaciones:', err);
      }
    });
  }

  getOrganizacionNombre(id: string): string {
    const org = this.organizaciones.find(o => o.id === id);
    return org ? org.nombre : 'N/A';
  }

  openModal(): void {
    this.showModal = true;
    this.isEditing = false;
    this.editingId = null;
    this.aplicacionForm.reset({ nombre: '', idOrganizacion: '', activa: true, fechaInicio: '', fechaFinal: '' });
  }

  editAplicacion(app: Aplicacion): void {
    this.showModal = true;
    this.isEditing = true;
    this.editingId = app.id;
    this.aplicacionForm.reset({
      nombre: app.nombre,
      idOrganizacion: app.idOrganizacion,
      activa: app.activa,
      fechaInicio: app.fechaInicio || '',
      fechaFinal: app.fechaFinal || ''
    });
  }

  closeModal(): void {
    this.showModal = false;
    this.isEditing = false;
    this.editingId = null;
    this.aplicacionForm.reset({ nombre: '', idOrganizacion: '', activa: true, fechaInicio: '', fechaFinal: '' });
  }

  closeModalOnOverlay(event: Event): void {
    if (event.target === event.currentTarget) {
      this.closeModal();
    }
  }

  saveAplicacion(): void {
    if (this.aplicacionForm.invalid) {
      this.errorMessage = 'El nombre y la organizacion son requeridos';
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const data: any = {
      nombre: this.aplicacionForm.value.nombre,
      idOrganizacion: this.aplicacionForm.value.idOrganizacion,
      activa: this.aplicacionForm.value.activa
    };

    if (this.aplicacionForm.value.fechaInicio) {
      data.fechaInicio = `${this.aplicacionForm.value.fechaInicio} 00:00:00`;
    }
    if (this.aplicacionForm.value.fechaFinal) {
      data.fechaFinal = `${this.aplicacionForm.value.fechaFinal} 00:00:00`;
    }

    this.apiService.createAplicacion(data).subscribe({
      next: (response) => {
        this.successMessage = response.mensajes[0] || 'Aplicacion creada exitosamente';
        this.saving = false;
        this.closeModal();
        this.loadAplicaciones();
      },
      error: (err) => {
        this.errorMessage = err.message || 'Error al crear la aplicacion';
        this.saving = false;
      }
    });
  }
}
