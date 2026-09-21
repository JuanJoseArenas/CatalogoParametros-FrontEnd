import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { EventStreamService } from '../../../../core/realtime/event-stream.service';
import { Funcionalidad } from '../../domain/funcionalidad';
import { FuncionalidadesRepository } from '../../domain/funcionalidades.repository';
import { Modulo } from '../../../modulos/domain/modulo';
import { ModulosRepository } from '../../../modulos/domain/modulos.repository';
import { fechaConZona } from '../../../../shared/utils/date.utils';
import { ConnectionStatusComponent } from '../../../../shared/ui/connection-status/connection-status.component';
import { PageMessagesComponent } from '../../../../shared/ui/page-messages/page-messages.component';
import { PaginationComponent } from '../../../../shared/ui/pagination/pagination.component';
import { RelatedEntityFormComponent, SelectOption } from '../../../../shared/ui/related-entity-form/related-entity-form.component';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-funcionalidades',
    imports: [CommonModule, FormsModule, ConnectionStatusComponent, PageMessagesComponent, PaginationComponent, RelatedEntityFormComponent],
    template: `
    <div class="funcionalidades">
      <div class="page-header">
        <h1>Funcionalidades</h1>
        <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
          <app-connection-status [connected]="isConnected" />
          <div class="search-bar">
            <span class="search-icon">🔍</span>
            <input type="text" placeholder="Buscar funcionalidad..." [(ngModel)]="searchTerm">
          </div>
          <button class="btn btn-primary" (click)="openModal()">+ Nueva</button>
        </div>
      </div>

      <app-page-messages [error]="errorMessage" [success]="successMessage" />

      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Lista de Funcionalidades</h2>
          <span style="font-size: 0.85rem; color: #64748b; font-weight: 500;">
            {{ filteredFuncionalidades.length }} registro(s) en pagina {{ page }}
          </span>
        </div>

        @if (filteredFuncionalidades.length > 0) {
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Modulo</th>
                  <th>Fecha Inicio</th>
                  <th>Fecha Fin</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (func of filteredFuncionalidades; track func) {
                  <tr>
                    <td>{{ func.nombre }}</td>
                    <td>{{ getModuloNombre(func.idModulo) }}</td>
                    <td>{{ (func.fechaInicio | slice:0:10) || '-' }}</td>
                    <td>{{ (func.fechaFinal | slice:0:10) || '-' }}</td>
                    <td>
                      <span class="badge" [class.badge-success]="func.activo" [class.badge-danger]="!func.activo">
                        {{ func.activo ? 'Activo' : 'Inactivo' }}
                      </span>
                    </td>
                    <td>
                      <button class="btn btn-warning btn-sm" (click)="editFuncionalidad(func)">Editar</button>
                      <button class="btn btn-secondary btn-sm" (click)="changeStatus(func)">
                        {{ func.activo ? 'Desactivar' : 'Activar' }}
                      </button>
                      <button class="btn btn-danger btn-sm" (click)="deleteFuncionalidad(func.id)">Eliminar</button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }

        @if (filteredFuncionalidades.length === 0 && !loading) {
          <div class="empty-state">
            <div class="empty-state-icon">⚙️</div>
            <h3>No hay funcionalidades</h3>
            <p>Comienza creando una nueva funcionalidad</p>
          </div>
        }

        @if (loading) {
          <div class="loading">
            <div class="spinner"></div>
          </div>
        }

        @if (!loading && funcionalidades.length > 0) {
          <app-pagination [page]="page" [hasNext]="funcionalidades.length >= pageSize" (pageChange)="changePage($event)" />
        }
      </div>
    </div>

    @if (showModal) {
      <app-related-entity-form
        [form]="funcionalidadForm" [options]="moduloOptions"
        entityLabel="Funcionalidad" relationLabel="Modulo"
        relationControl="idModulo" activeControl="activo"
        relationArticle="un" activeLabel="Activa" inactiveLabel="Inactiva"
        [editing]="isEditing" [saving]="saving"
        (save)="saveFuncionalidad()" (cancel)="closeModal()"
      />
    }
    `,
    changeDetection: ChangeDetectionStrategy.Eager,
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
  page = 1;
  pageSize = 10;
  private subscriptions: Subscription[] = [];

  get moduloOptions(): SelectOption[] {
    return this.modulos.map(item => ({ id: item.id, name: item.nombre }));
  }

  constructor(private repository: FuncionalidadesRepository, private modulosRepository: ModulosRepository, private fb: FormBuilder, private eventStream: EventStreamService) {
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

    this.repository.findPage(this.page, this.pageSize).subscribe({
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

  changePage(page: number): void {
    if (page < 1 || this.loading) return;
    this.page = page;
    this.loadFuncionalidades();
  }

  loadModulos(): void {
    this.modulosRepository.findAll().subscribe({
      next: (data) => {
        this.modulos = data;
      },
      error: (err) => {
        console.error('Error al cargar modulos:', err);
      }
    });
  }

  connectSse(): void {
    const sub = this.eventStream.connect<any>(this.repository.eventsUrl, 'funcionalidad').subscribe({
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
      fechaInicio: func.fechaInicio?.slice(0, 10) || '',
      fechaFinal: func.fechaFinal?.slice(0, 10) || ''
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
      data.fechaInicio = fechaConZona(this.funcionalidadForm.value.fechaInicio);
    }
    if (this.funcionalidadForm.value.fechaFinal) {
      data.fechaFinal = fechaConZona(this.funcionalidadForm.value.fechaFinal);
    }

    if (this.isEditing && this.editingId) {
      this.repository.update(this.editingId, data).subscribe({
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
      this.repository.create(data).subscribe({
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

    this.repository.delete(id).subscribe({
      next: (response) => {
        this.successMessage = response.mensajes[0] || 'Funcionalidad eliminada exitosamente';
        this.errorMessage = '';
      },
      error: (err) => {
        this.errorMessage = err.message || 'Error al eliminar la funcionalidad';
      }
    });
  }

  changeStatus(funcionalidad: Funcionalidad): void {
    const activo = !funcionalidad.activo;
    this.errorMessage = '';
    this.successMessage = '';

    this.repository.changeStatus(funcionalidad.id, activo).subscribe({
      next: (response) => {
        this.funcionalidades = this.funcionalidades.map(func =>
          func.id === funcionalidad.id ? { ...func, activo } : func
        );
        this.successMessage = response.mensajes[0] || `Funcionalidad ${activo ? 'activada' : 'desactivada'} exitosamente`;
      },
      error: (err) => {
        this.errorMessage = err.message || 'Error al cambiar el estado de la funcionalidad';
      }
    });
  }
}
