import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { EventStreamService } from '../../../../core/realtime/event-stream.service';
import { Modulo } from '../../domain/modulo';
import { ModulosRepository } from '../../domain/modulos.repository';
import { Aplicacion } from '../../../aplicaciones/domain/aplicacion';
import { AplicacionesRepository } from '../../../aplicaciones/domain/aplicaciones.repository';
import { fechaConZona, fechaParaFormulario, mostrarFechaLocal, fechaLocalValida } from '../../../../shared/utils/date.utils';
import { ConnectionStatusComponent } from '../../../../shared/ui/connection-status/connection-status.component';
import { PageMessagesComponent } from '../../../../shared/ui/page-messages/page-messages.component';
import { PaginationComponent } from '../../../../shared/ui/pagination/pagination.component';
import { RelatedEntityFormComponent, SelectOption } from '../../../../shared/ui/related-entity-form/related-entity-form.component';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-modulos',
    imports: [CommonModule, FormsModule, ConnectionStatusComponent, PageMessagesComponent, PaginationComponent, RelatedEntityFormComponent],
    template: `
    <div class="modulos">
      <div class="page-header">
        <h1>Modulos</h1>
        <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
          <app-connection-status [connected]="isConnected" />
          <div class="search-bar">
            <span class="search-icon">🔍</span>
            <input type="text" placeholder="Buscar modulo..." [(ngModel)]="searchTerm">
          </div>
          <button class="btn btn-primary" (click)="openModal()">+ Nuevo</button>
        </div>
      </div>

      <app-page-messages [error]="errorMessage" [success]="successMessage" />

      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Lista de Modulos</h2>
          <span style="font-size: 0.85rem; color: #64748b; font-weight: 500;">
            {{ filteredModulos.length }} registro(s) en pagina {{ page }}
          </span>
        </div>

        @if (filteredModulos.length > 0) {
          <div class="table-container">
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
                @for (mod of filteredModulos; track mod) {
                  <tr>
                    <td>{{ mod.nombre }}</td>
                    <td>{{ getAplicacionNombre(mod.idAplicacion) }}</td>
                    <td>{{ mostrarFechaLocal(mod.fechaInicio) }}</td>
                    <td>{{ mostrarFechaLocal(mod.fechaFinal) }}</td>
                    <td>
                      <span class="badge" [class.badge-success]="mod.activo" [class.badge-danger]="!mod.activo">
                        {{ mod.activo ? 'Activo' : 'Inactivo' }}
                      </span>
                    </td>
                    <td>
                      <button class="btn btn-warning btn-sm" (click)="editModulo(mod)">Editar</button>
                      <button class="btn btn-secondary btn-sm" (click)="changeStatus(mod)">
                        {{ mod.activo ? 'Desactivar' : 'Activar' }}
                      </button>
                      <button class="btn btn-danger btn-sm" (click)="deleteModulo(mod.id)">Eliminar</button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }

        @if (filteredModulos.length === 0 && !loading) {
          <div class="empty-state">
            <div class="empty-state-icon">📦</div>
            <h3>No hay modulos</h3>
            <p>Comienza creando un nuevo modulo</p>
          </div>
        }

        @if (loading) {
          <div class="loading">
            <div class="spinner"></div>
          </div>
        }

        @if (!loading && modulos.length > 0) {
          <app-pagination [page]="page" [hasNext]="modulos.length >= pageSize" (pageChange)="changePage($event)" />
        }
      </div>
    </div>

    @if (showModal) {
      <app-related-entity-form
        [form]="moduloForm" [options]="aplicacionOptions"
        entityLabel="Modulo" relationLabel="Aplicacion"
        relationControl="idAplicacion" activeControl="activo"
        createLabel="Nuevo" relationArticle="una"
        activeLabel="Activo" inactiveLabel="Inactivo"
        [editing]="isEditing" [saving]="saving"
        (save)="saveModulo()" (cancel)="closeModal()"
      />
    }
    `,
    changeDetection: ChangeDetectionStrategy.Eager,
    styles: [`
    .modulos {
      max-width: 1200px;
      margin: 0 auto;
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
  readonly mostrarFechaLocal = mostrarFechaLocal;
  private fechasOriginales: { fechaInicio?: string; fechaFinal?: string } = {};
  private subscriptions: Subscription[] = [];

  get aplicacionOptions(): SelectOption[] {
    return this.aplicaciones.map(item => ({ id: item.id, name: item.nombre }));
  }

  constructor(private repository: ModulosRepository, private aplicacionesRepository: AplicacionesRepository, private fb: FormBuilder, private eventStream: EventStreamService) {
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

    this.repository.findPage(this.page, this.pageSize).subscribe({
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
    this.aplicacionesRepository.findAll().subscribe({
      next: (data) => {
        this.aplicaciones = data;
      },
      error: (err) => {
        console.error('Error al cargar aplicaciones:', err);
      }
    });
  }

  connectSse(): void {
    const sub = this.eventStream.connect<any>(this.repository.eventsUrl, 'modulo').subscribe({
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
    this.fechasOriginales = {};
    this.moduloForm.reset({ nombre: '', idAplicacion: '', activo: true, fechaInicio: '', fechaFinal: '' });
  }

  editModulo(mod: Modulo): void {
    this.showModal = true;
    this.isEditing = true;
    this.editingId = mod.id;
    this.fechasOriginales = { fechaInicio: mod.fechaInicio, fechaFinal: mod.fechaFinal };
    this.moduloForm.reset({
      nombre: mod.nombre,
      idAplicacion: mod.idAplicacion,
      activo: mod.activo,
      fechaInicio: fechaParaFormulario(mod.fechaInicio),
      fechaFinal: fechaParaFormulario(mod.fechaFinal)
    });
  }

  closeModal(): void {
    this.showModal = false;
    this.isEditing = false;
    this.editingId = null;
    this.fechasOriginales = {};
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

    if (![this.moduloForm.value.fechaInicio, this.moduloForm.value.fechaFinal]
      .every(fecha => fechaLocalValida(fecha || ''))) {
      this.errorMessage = 'Ingrese fechas y horas v?lidas para su zona horaria.';
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
      data.fechaInicio = fechaConZona(this.moduloForm.value.fechaInicio, this.fechasOriginales.fechaInicio);
    }
    if (this.moduloForm.value.fechaFinal) {
      data.fechaFinal = fechaConZona(this.moduloForm.value.fechaFinal, this.fechasOriginales.fechaFinal);
    }

    const request = this.isEditing && this.editingId
      ? this.repository.update(this.editingId, data)
      : this.repository.create(data);

    request.subscribe({
      next: (response) => {
        this.successMessage = response.mensajes[0] || (this.isEditing ? 'Modulo actualizado exitosamente' : 'Modulo creado exitosamente');
        this.saving = false;
        this.closeModal();
        this.loadModulos();
      },
      error: (err) => {
        this.errorMessage = err.message || (this.isEditing ? 'Error al actualizar el modulo' : 'Error al crear el modulo');
        this.saving = false;
      }
    });
  }

  deleteModulo(id: string): void {
    if (!confirm('¿Está seguro de eliminar este modulo?')) return;

    this.errorMessage = '';
    this.successMessage = '';
    this.repository.delete(id).subscribe({
      next: (response) => {
        this.successMessage = response.mensajes[0] || 'Modulo eliminado exitosamente';
        this.loadModulos();
      },
      error: (err) => {
        this.errorMessage = err.message || 'Error al eliminar el modulo';
      }
    });
  }

  changeStatus(modulo: Modulo): void {
    const activo = !modulo.activo;
    this.errorMessage = '';
    this.successMessage = '';

    this.repository.changeStatus(modulo.id, activo).subscribe({
      next: (response) => {
        this.modulos = this.modulos.map(mod =>
          mod.id === modulo.id ? { ...mod, activo } : mod
        );
        this.successMessage = response.mensajes[0] || `Modulo ${activo ? 'activado' : 'desactivado'} exitosamente`;
      },
      error: (err) => {
        this.errorMessage = err.message || 'Error al cambiar el estado del modulo';
      }
    });
  }
}
