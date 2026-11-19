import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';

import { FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { EventStreamService } from '../../../../core/realtime/event-stream.service';
import { Parametro, TipoParametro } from '../../domain/parametro';
import { ParametrosRepository } from '../../domain/parametros.repository';
import { Funcionalidad } from '../../../funcionalidades/domain/funcionalidad';
import { FuncionalidadesRepository } from '../../../funcionalidades/domain/funcionalidades.repository';
import { ConnectionStatusComponent } from '../../../../shared/ui/connection-status/connection-status.component';
import { PageMessagesComponent } from '../../../../shared/ui/page-messages/page-messages.component';
import { PaginationComponent } from '../../../../shared/ui/pagination/pagination.component';
import { ParametroFormComponent } from '../components/parametro-form.component';
import { Subscription } from 'rxjs';
import { CargaMasivaParametrosComponent } from '../components/carga-masiva-parametros.component';
import { ordenarPorNombre } from '../../../../shared/utils/ordenar-por-texto';

@Component({
    selector: 'app-parametros',
    imports: [FormsModule, ConnectionStatusComponent, PageMessagesComponent, PaginationComponent, ParametroFormComponent, CargaMasivaParametrosComponent],
    template: `
    <div class="parametros">
      <div class="page-header">
        <h1>Parámetros</h1>
        <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
          <app-connection-status [connected]="isConnected" />
          <div class="search-bar">
            <span class="search-icon">🔍</span>
            <input type="text" placeholder="Buscar parámetro..." [(ngModel)]="searchTerm">
          </div>
          <button class="btn btn-secondary" (click)="bulkOpen = true">Carga masiva</button>
          <button class="btn btn-primary" (click)="openModal()">+ Nuevo</button>
        </div>
      </div>

      <app-page-messages [error]="errorMessage" [success]="successMessage" />

      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Lista de parámetros</h2>
          <span style="font-size: 0.85rem; color: #64748b; font-weight: 500;">
            {{ filteredParametros.length }} registro(s) en la página {{ page }}
          </span>
        </div>

        @if (filteredParametros.length > 0) {
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Funcionalidad</th>
                  <th>Tipo de parámetro</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (param of filteredParametros; track param) {
                  <tr>
                    <td>{{ param.nombre }}</td>
                    <td>{{ getFuncionalidadNombre(param.idFuncionalidad) }}</td>
                    <td>{{ getTipoParametroNombre(param.idTipoParametro) }}</td>
                    <td>
                      <span class="badge" [class.badge-success]="param.activo" [class.badge-danger]="!param.activo">
                        {{ param.activo ? 'Activo' : 'Inactivo' }}
                      </span>
                    </td>
                    <td>
                      <button class="btn btn-warning btn-sm" (click)="editParametro(param)">Editar</button>
                      <button class="btn btn-secondary btn-sm" (click)="changeStatus(param)">
                        {{ param.activo ? 'Desactivar' : 'Activar' }}
                      </button>
                      <button class="btn btn-danger btn-sm" (click)="deleteParametro(param.id)">Eliminar</button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }

        @if (filteredParametros.length === 0 && !loading) {
          <div class="empty-state">
            <div class="empty-state-icon">🔧</div>
            <h3>No hay parámetros</h3>
            <p>Comienza creando un nuevo parámetro.</p>
          </div>
        }

        @if (loading) {
          <div class="loading">
            <div class="spinner"></div>
          </div>
        }

        @if (!loading && parametros.length > 0) {
          <app-pagination [page]="page" [hasNext]="parametros.length >= pageSize" (pageChange)="changePage($event)" />
        }
      </div>
    </div>

    @if (showModal) {
      <app-parametro-form
        [form]="parametroForm" [funcionalidades]="funcionalidades" [tipos]="tiposParametro"
        [editing]="isEditing" [saving]="saving"
        (save)="saveParametro()" (cancel)="closeModal()"
      />
    }
    @if (bulkOpen) {
      <app-carga-masiva-parametros (closed)="bulkOpen = false" (completed)="loadParametros()" />
    }
    `,
    changeDetection: ChangeDetectionStrategy.Eager,
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
  tiposParametro: TipoParametro[] = [];
  loading = false;
  saving = false;
  showModal = false;
  bulkOpen = false;
  isEditing = false;
  editingId: string | null = null;
  errorMessage = '';
  successMessage = '';
  parametroForm: FormGroup;
  searchTerm = '';
  isConnected = false;
  page = 1;
  pageSize = 10;
  private subscriptions: Subscription[] = [];

  constructor(private repository: ParametrosRepository, private funcionalidadesRepository: FuncionalidadesRepository, private fb: FormBuilder, private eventStream: EventStreamService) {
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
    this.loadTiposParametro();
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

    this.repository.findPage(this.page, this.pageSize).subscribe({
      next: (data) => {
        this.parametros = ordenarPorNombre(data);
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = err.message || 'Error al cargar los parámetros.';
        this.loading = false;
      }
    });
  }

  changePage(page: number): void {
    if (page < 1 || this.loading) return;
    this.page = page;
    this.loadParametros();
  }

  loadFuncionalidades(): void {
    this.funcionalidadesRepository.findAll().subscribe({
      next: (data) => {
        this.funcionalidades = ordenarPorNombre(data);
      },
      error: (err) => {
        console.error('Error al cargar funcionalidades:', err);
      }
    });
  }

  connectSse(): void {
    const sub = this.eventStream.connect<any>(this.repository.eventsUrl, 'parametro', connected => this.isConnected = connected).subscribe({
      next: (data: any) => {
        this.isConnected = true;

        const entity = data.parametro;
        const eventType = data.event;

        if (!entity) return;

        switch (eventType) {
          case 'CREATED':
            if (!this.parametros.find(p => p.id === entity.id)) {
              this.parametros = ordenarPorNombre([...this.parametros, entity]);
            }
            break;
          case 'UPDATED':
            this.parametros = ordenarPorNombre(this.parametros.map(p => p.id === entity.id ? entity : p));
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

  getTipoParametroNombre(id: string): string {
    const tipo = this.tiposParametro.find(t => t.id === id);
    return tipo ? tipo.nombre : 'N/A';
  }

  loadTiposParametro(): void {
    this.repository.findTypes().subscribe({
      next: (data) => {
        this.tiposParametro = ordenarPorNombre(data);
      },
      error: (err) => {
        console.error('Error al cargar tipos de parámetro:', err);
      }
    });
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
      this.errorMessage = 'Todos los campos son obligatorios.';
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
      this.repository.update(this.editingId, data).subscribe({
        next: (response) => {
          this.successMessage = response.mensajes[0] || 'Parámetro actualizado correctamente.';
          this.saving = false;
          this.closeModal();
        },
        error: (err) => {
          this.errorMessage = err.message || 'Error al actualizar el parámetro.';
          this.saving = false;
        }
      });
    } else {
      this.repository.create(data).subscribe({
        next: (response) => {
          this.successMessage = response.mensajes[0] || 'Parámetro creado correctamente.';
          this.saving = false;
          this.closeModal();
        },
        error: (err) => {
          this.errorMessage = err.message || 'Error al crear el parámetro.';
          this.saving = false;
        }
      });
    }
  }

  deleteParametro(id: string): void {
    if (!confirm('¿Está seguro de eliminar este parámetro?')) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    this.repository.delete(id).subscribe({
      next: (response) => {
        this.successMessage = response.mensajes[0] || 'Parámetro eliminado correctamente.';
        this.errorMessage = '';
      },
      error: (err) => {
        this.errorMessage = err.message || 'Error al eliminar el parámetro.';
      }
    });
  }

  changeStatus(parametro: Parametro): void {
    const activo = !parametro.activo;
    this.errorMessage = '';
    this.successMessage = '';

    this.repository.changeStatus(parametro.id, activo).subscribe({
      next: (response) => {
        this.parametros = this.parametros.map(param =>
          param.id === parametro.id ? { ...param, activo } : param
        );
        this.successMessage = response.mensajes[0] || `Parámetro ${activo ? 'activado' : 'desactivado'} correctamente.`;
      },
      error: (err) => {
        this.errorMessage = err.message || 'Error al cambiar el estado del parámetro.';
      }
    });
  }
}
