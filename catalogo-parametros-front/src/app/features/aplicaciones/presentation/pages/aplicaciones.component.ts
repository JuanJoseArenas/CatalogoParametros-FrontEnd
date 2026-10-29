import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { EventStreamService } from '../../../../core/realtime/event-stream.service';
import { Aplicacion } from '../../domain/aplicacion';
import { AplicacionesRepository } from '../../domain/aplicaciones.repository';
import { Organizacion } from '../../../organizaciones/domain/organizacion';
import { OrganizacionesRepository } from '../../../organizaciones/domain/organizaciones.repository';
import { fechaConZona, fechaParaFormulario, mostrarFechaLocal, fechaLocalValida } from '../../../../shared/utils/date.utils';
import { ConnectionStatusComponent } from '../../../../shared/ui/connection-status/connection-status.component';
import { PageMessagesComponent } from '../../../../shared/ui/page-messages/page-messages.component';
import { PaginationComponent } from '../../../../shared/ui/pagination/pagination.component';
import { RelatedEntityFormComponent, SelectOption } from '../../../../shared/ui/related-entity-form/related-entity-form.component';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-aplicaciones',
    imports: [CommonModule, FormsModule, ConnectionStatusComponent, PageMessagesComponent, PaginationComponent, RelatedEntityFormComponent],
    template: `
    <div class="aplicaciones">
      <div class="page-header">
        <h1>Aplicaciones</h1>
        <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
          <app-connection-status [connected]="isConnected" />
          <div class="search-bar">
            <span class="search-icon">🔍</span>
            <input type="text" placeholder="Buscar aplicacion..." [(ngModel)]="searchTerm">
          </div>
          <button class="btn btn-primary" (click)="openModal()">+ Nueva</button>
        </div>
      </div>

      <app-page-messages [error]="errorMessage" [success]="successMessage" />

      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Lista de Aplicaciones</h2>
          <span style="font-size: 0.85rem; color: #64748b; font-weight: 500;">
            {{ filteredAplicaciones.length }} registro(s) en pagina {{ page }}
          </span>
        </div>

        @if (filteredAplicaciones.length > 0) {
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Organizacion</th>
                  <th>Fecha Inicio</th>
                  <th>Fecha Fin</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (app of filteredAplicaciones; track app) {
                  <tr>
                    <td>{{ app.nombre }}</td>
                    <td>{{ getOrganizacionNombre(app.idOrganizacion) }}</td>
                    <td>{{ mostrarFechaLocal(app.fechaInicio) }}</td>
                    <td>{{ mostrarFechaLocal(app.fechaFinal) }}</td>
                    <td>
                      <span class="badge" [class.badge-success]="app.activa" [class.badge-danger]="!app.activa">
                        {{ app.activa ? 'Activa' : 'Inactiva' }}
                      </span>
                    </td>
                    <td>
                      <div style="display: flex; gap: 8px;">
                        <button class="btn btn-warning btn-sm" (click)="editAplicacion(app)">Editar</button>
                        <button class="btn btn-secondary btn-sm" (click)="changeStatus(app)">
                          {{ app.activa ? 'Desactivar' : 'Activar' }}
                        </button>
                        <button class="btn btn-danger btn-sm" (click)="deleteAplicacion(app.id)">Eliminar</button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }

        @if (filteredAplicaciones.length === 0 && !loading) {
          <div class="empty-state">
            <div class="empty-state-icon">📱</div>
            <h3>No hay aplicaciones</h3>
            <p>Comienza creando una nueva aplicacion</p>
          </div>
        }

        @if (loading) {
          <div class="loading">
            <div class="spinner"></div>
          </div>
        }

        @if (!loading && aplicaciones.length > 0) {
          <app-pagination [page]="page" [hasNext]="aplicaciones.length >= pageSize" (pageChange)="changePage($event)" />
        }
      </div>
    </div>

    @if (showModal) {
      <app-related-entity-form
        [form]="aplicacionForm" [options]="organizacionOptions"
        entityLabel="Aplicacion" relationLabel="Organizacion"
        relationControl="idOrganizacion" activeControl="activa"
        [editing]="isEditing" [saving]="saving"
        (save)="saveAplicacion()" (cancel)="closeModal()"
      />
    }
    `,
    changeDetection: ChangeDetectionStrategy.Eager,
    styles: [`
    .aplicaciones {
      max-width: 1200px;
      margin: 0 auto;
    }
  `]
})
export class AplicacionesComponent implements OnInit, OnDestroy {
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
  searchTerm = '';
  isConnected = false;
  page = 1;
  pageSize = 10;
  readonly mostrarFechaLocal = mostrarFechaLocal;
  private fechasOriginales: { fechaInicio?: string; fechaFinal?: string } = {};
  private subscriptions: Subscription[] = [];

  get organizacionOptions(): SelectOption[] {
    return this.organizaciones.map(item => ({ id: item.id, name: item.nombre }));
  }

  constructor(private repository: AplicacionesRepository, private organizacionesRepository: OrganizacionesRepository, private fb: FormBuilder, private eventStream: EventStreamService) {
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
    this.connectSse();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  get filteredAplicaciones(): Aplicacion[] {
    if (!this.searchTerm.trim()) return this.aplicaciones;
    return this.aplicaciones.filter(app =>
      app.nombre.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  loadAplicaciones(): void {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.repository.findPage(this.page, this.pageSize).subscribe({
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

  changePage(page: number): void {
    if (page < 1 || this.loading) return;
    this.page = page;
    this.loadAplicaciones();
  }

  loadOrganizaciones(): void {
    this.organizacionesRepository.findAll().subscribe({
      next: (data) => {
        this.organizaciones = data;
      },
      error: (err) => {
        console.error('Error al cargar organizaciones:', err);
      }
    });
  }

  connectSse(): void {
    const sub = this.eventStream.connect<any>(this.repository.eventsUrl, 'aplicacion').subscribe({
      next: (data: any) => {
        this.isConnected = true;

        const entity = data.aplicacion;
        const eventType = data.event;

        if (!entity) return;

        switch (eventType) {
          case 'CREATED':
            if (!this.aplicaciones.find(a => a.id === entity.id)) {
              this.aplicaciones = [...this.aplicaciones, entity];
            }
            break;
          case 'UPDATED':
            this.aplicaciones = this.aplicaciones.map(a =>
              a.id === entity.id ? entity : a
            );
            break;
          case 'DELETED':
            this.aplicaciones = this.aplicaciones.filter(a => a.id !== entity.id);
            break;
        }
      },
      error: () => {
        this.isConnected = false;
      }
    });
    this.subscriptions.push(sub);
  }

  getOrganizacionNombre(id: string): string {
    const org = this.organizaciones.find(o => o.id === id);
    return org ? org.nombre : 'N/A';
  }

  openModal(): void {
    this.showModal = true;
    this.isEditing = false;
    this.editingId = null;
    this.fechasOriginales = {};
    this.aplicacionForm.reset({ nombre: '', idOrganizacion: '', activa: true, fechaInicio: '', fechaFinal: '' });
  }

  editAplicacion(app: Aplicacion): void {
    this.showModal = true;
    this.isEditing = true;
    this.editingId = app.id;
    this.fechasOriginales = { fechaInicio: app.fechaInicio, fechaFinal: app.fechaFinal };
    this.aplicacionForm.reset({
      nombre: app.nombre,
      idOrganizacion: app.idOrganizacion,
      activa: app.activa,
      fechaInicio: fechaParaFormulario(app.fechaInicio),
      fechaFinal: fechaParaFormulario(app.fechaFinal)
    });
  }

  closeModal(): void {
    this.showModal = false;
    this.isEditing = false;
    this.editingId = null;
    this.fechasOriginales = {};
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

    if (![this.aplicacionForm.value.fechaInicio, this.aplicacionForm.value.fechaFinal]
      .every(fecha => fechaLocalValida(fecha || ''))) {
      this.errorMessage = 'Ingrese fechas y horas v?lidas para su zona horaria.';
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
      data.fechaInicio = fechaConZona(this.aplicacionForm.value.fechaInicio, this.fechasOriginales.fechaInicio);
    }
    if (this.aplicacionForm.value.fechaFinal) {
      data.fechaFinal = fechaConZona(this.aplicacionForm.value.fechaFinal, this.fechasOriginales.fechaFinal);
    }

    if (this.isEditing && this.editingId) {
      this.repository.update(this.editingId, data).subscribe({
        next: (response) => {
          this.successMessage = response.mensajes[0] || 'Aplicacion actualizada exitosamente';
          this.saving = false;
          this.closeModal();
        },
        error: (err) => {
          this.errorMessage = err.message || 'Error al actualizar la aplicacion';
          this.saving = false;
        }
      });
    } else {
      this.repository.create(data).subscribe({
        next: (response) => {
          this.successMessage = response.mensajes[0] || 'Aplicacion creada exitosamente';
          this.saving = false;
          this.closeModal();
        },
        error: (err) => {
          this.errorMessage = err.message || 'Error al crear la aplicacion';
          this.saving = false;
        }
      });
    }
  }

  deleteAplicacion(id: string): void {
    if (!confirm('¿Esta seguro de que desea eliminar esta aplicacion?')) {
      return;
    }

    this.repository.delete(id).subscribe({
      next: (response) => {
        this.successMessage = response.mensajes[0] || 'Aplicacion eliminada exitosamente';
        this.errorMessage = '';
      },
      error: (err) => {
        this.errorMessage = err.message || 'Error al eliminar la aplicacion';
        this.successMessage = '';
      }
    });
  }

  changeStatus(aplicacion: Aplicacion): void {
    const activa = !aplicacion.activa;
    this.errorMessage = '';
    this.successMessage = '';

    this.repository.changeStatus(aplicacion.id, activa).subscribe({
      next: (response) => {
        this.aplicaciones = this.aplicaciones.map(app =>
          app.id === aplicacion.id ? { ...app, activa } : app
        );
        this.successMessage = response.mensajes[0] || `Aplicacion ${activa ? 'activada' : 'desactivada'} exitosamente`;
      },
      error: (err) => {
        this.errorMessage = err.message || 'Error al cambiar el estado de la aplicacion';
      }
    });
  }
}
