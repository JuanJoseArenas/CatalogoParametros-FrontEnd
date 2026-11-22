import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { EventStreamService } from '../../../../core/realtime/event-stream.service';
import { Aplicacion } from '../../domain/aplicacion';
import { AplicacionesRepository } from '../../domain/aplicaciones.repository';
import { Organizacion } from '../../../organizaciones/domain/organizacion';
import { OrganizacionesRepository } from '../../../organizaciones/domain/organizaciones.repository';
import { Ambiente } from '../../../ambientes/domain/ambiente';
import { AmbientesRepository } from '../../../ambientes/domain/ambientes.repository';
import { IdentidadServicio } from '../../../identidades-servicio/domain/identidad-servicio';
import { IdentidadesServicioRepository } from '../../../identidades-servicio/domain/identidades-servicio.repository';
import { fechaConZona, fechaParaFormulario, mostrarFechaLocal, fechaLocalValida } from '../../../../shared/utils/date.utils';
import { ConnectionStatusComponent } from '../../../../shared/ui/connection-status/connection-status.component';
import { PageMessagesComponent } from '../../../../shared/ui/page-messages/page-messages.component';
import { PaginationComponent } from '../../../../shared/ui/pagination/pagination.component';
import { RelatedEntityFormComponent, SelectOption } from '../../../../shared/ui/related-entity-form/related-entity-form.component';
import { Subscription } from 'rxjs';
import { ordenarPorNombre } from '../../../../shared/utils/ordenar-por-texto';

@Component({
    selector: 'app-aplicaciones',
    imports: [CommonModule, FormsModule, ReactiveFormsModule, ConnectionStatusComponent, PageMessagesComponent, PaginationComponent, RelatedEntityFormComponent],
    template: `
    <div class="aplicaciones">
      <div class="page-header">
        <h1>Aplicaciones</h1>
        <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
          <app-connection-status [connected]="isConnected" />
          <div class="search-bar">
            <span class="search-icon">🔍</span>
            <input type="text" placeholder="Buscar aplicación..." [(ngModel)]="searchTerm">
          </div>
          <button class="btn btn-primary" (click)="openModal()">+ Nueva</button>
        </div>
      </div>

      <app-page-messages [error]="errorMessage" [success]="successMessage" />

      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Lista de Aplicaciones</h2>
          <span style="font-size: 0.85rem; color: #64748b; font-weight: 500;">
            {{ filteredAplicaciones.length }} registro(s) en la página {{ page }}
          </span>
        </div>

        @if (filteredAplicaciones.length > 0) {
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Organización</th>
                  <th>Fecha de inicio</th>
                  <th>Fecha de fin</th>
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
                        <button class="btn btn-secondary btn-sm" (click)="openServiceIdentities(app)">Identidad de servicio</button>
                        <button class="btn btn-secondary btn-sm" type="button"
                                (click)="copyApplicationId(app)"
                                [attr.aria-label]="'Copiar ID de la aplicación ' + app.nombre"
                                title="Copiar ID de la aplicación">Copiar ID</button>
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
            <p>Comienza creando una nueva aplicación.</p>
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
        entityLabel="Aplicación" relationLabel="Organización"
        relationControl="idOrganizacion" activeControl="activa"
        [editing]="isEditing" [saving]="saving"
        (save)="saveAplicacion()" (cancel)="closeModal()"
      />
    }

    @if (showServiceIdentityModal && selectedAplicacion) {
      <div class="modal-overlay" (click)="closeServiceIdentityModalOnOverlay($event)">
        <div class="modal service-identity-modal" role="dialog" aria-modal="true" aria-labelledby="service-identity-title">
          <div class="modal-header">
            <h3 class="modal-title" id="service-identity-title">Identidad de servicio · {{ selectedAplicacion.nombre }}</h3>
            <button class="modal-close" type="button" (click)="closeServiceIdentityModal()">&times;</button>
          </div>
          <div class="modal-body">
            <app-page-messages [error]="identityErrorMessage" [success]="identitySuccessMessage" />
            <p class="field-help">Asocie el <code>client_id</code> creado en Seguridad al ambiente que consume esta aplicación. El secreto no se guarda aquí.</p>
            <form [formGroup]="identityForm" (ngSubmit)="registerServiceIdentity()">
              <div class="form-group">
                <label class="form-label" for="identity-environment">Ambiente</label>
                <select id="identity-environment" class="form-control" formControlName="idAmbiente">
                  <option value="">Seleccione un ambiente</option>
                  @for (ambiente of ambientes; track ambiente.id) {
                    <option [value]="ambiente.id">{{ ambiente.nombre }}</option>
                  }
                </select>
              </div>
              <div class="form-group">
                <label class="form-label" for="identity-client-id">Client ID</label>
                <input id="identity-client-id" class="form-control" formControlName="clientId"
                       placeholder="svc-..." autocomplete="off">
                <small class="field-help">Pegue únicamente el Client ID de Seguridad, no el Client Secret.</small>
              </div>
            </form>

            <h4 class="service-identity-list-title">Identidades asociadas</h4>
            @if (identityLoading) {
              <div class="loading"><div class="spinner"></div></div>
            } @else if (identidadesServicio.length === 0) {
              <p class="field-help">Todavía no hay identidades asociadas a esta aplicación.</p>
            } @else {
              <div class="table-container">
                <table>
                  <thead>
                    <tr><th>Ambiente</th><th>Client ID</th><th>Acción</th></tr>
                  </thead>
                  <tbody>
                    @for (identity of identidadesServicio; track identity.id) {
                      <tr>
                        <td>{{ getAmbienteNombre(identity.idAmbiente) }}</td>
                        <td><code>{{ identity.clientId }}</code></td>
                        <td><button class="btn btn-danger btn-sm" type="button" (click)="removeServiceIdentity(identity)">Retirar</button></td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" type="button" (click)="closeServiceIdentityModal()">Cerrar</button>
            <button class="btn btn-primary" type="button" (click)="registerServiceIdentity()"
                    [disabled]="identityForm.invalid || identitySaving">
              {{ identitySaving ? 'Guardando...' : 'Asociar identidad' }}
            </button>
          </div>
        </div>
      </div>
    }
    `,
    changeDetection: ChangeDetectionStrategy.Eager,
    styles: [`
    .aplicaciones {
      max-width: 1200px;
      margin: 0 auto;
    }
    .service-identity-modal { max-width: 760px; }
    .service-identity-list-title { margin: 24px 0 12px; color: #0f5132; }
  `]
})
export class AplicacionesComponent implements OnInit, OnDestroy {
  aplicaciones: Aplicacion[] = [];
  organizaciones: Organizacion[] = [];
  ambientes: Ambiente[] = [];
  identidadesServicio: IdentidadServicio[] = [];
  loading = false;
  saving = false;
  identityLoading = false;
  identitySaving = false;
  showModal = false;
  showServiceIdentityModal = false;
  isEditing = false;
  editingId: string | null = null;
  selectedAplicacion: Aplicacion | null = null;
  errorMessage = '';
  successMessage = '';
  identityErrorMessage = '';
  identitySuccessMessage = '';
  aplicacionForm: FormGroup;
  identityForm: FormGroup;
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

  constructor(private repository: AplicacionesRepository, private organizacionesRepository: OrganizacionesRepository,
    private fb: FormBuilder, private eventStream: EventStreamService,
    @Optional() private readonly ambientesRepository?: AmbientesRepository,
    @Optional() private readonly identidadesRepository?: IdentidadesServicioRepository) {
    this.aplicacionForm = this.fb.group({
      nombre: ['', Validators.required],
      idOrganizacion: ['', Validators.required],
      activa: [true],
      fechaInicio: [''],
      fechaFinal: ['']
    });
    this.identityForm = this.fb.group({
      idAmbiente: ['', Validators.required],
      clientId: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9][A-Za-z0-9._:@-]{0,254}$/)]]
    });
  }

  ngOnInit(): void {
    this.loadAplicaciones();
    this.loadOrganizaciones();
    this.loadAmbientes();
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
        this.aplicaciones = ordenarPorNombre(data);
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
        this.organizaciones = ordenarPorNombre(data);
      },
      error: (err) => {
        console.error('Error al cargar organizaciones:', err);
      }
    });
  }

  loadAmbientes(): void {
    if (!this.ambientesRepository) return;
    this.ambientesRepository.findPage(1, 100).subscribe({
      next: data => this.ambientes = ordenarPorNombre(data),
      error: err => console.error('Error al cargar ambientes:', err)
    });
  }

  openServiceIdentities(aplicacion: Aplicacion): void {
    this.selectedAplicacion = aplicacion;
    this.showServiceIdentityModal = true;
    this.identityErrorMessage = '';
    this.identitySuccessMessage = '';
    this.identityForm.reset({ idAmbiente: '', clientId: '' });
    this.loadServiceIdentities(aplicacion.id);
  }

  closeServiceIdentityModal(): void {
    this.showServiceIdentityModal = false;
    this.selectedAplicacion = null;
    this.identidadesServicio = [];
    this.identityForm.reset({ idAmbiente: '', clientId: '' });
  }

  closeServiceIdentityModalOnOverlay(event: Event): void {
    if (event.target === event.currentTarget) this.closeServiceIdentityModal();
  }

  loadServiceIdentities(idAplicacion: string): void {
    if (!this.identidadesRepository) return;
    this.identityLoading = true;
    this.identidadesRepository.findByAplicacion(idAplicacion).subscribe({
      next: data => {
        this.identidadesServicio = data;
        this.identityLoading = false;
      },
      error: err => {
        this.identityErrorMessage = err.message || 'Error al consultar las identidades de servicio.';
        this.identityLoading = false;
      }
    });
  }

  getAmbienteNombre(idAmbiente: string): string {
    const ambiente = this.ambientes.find(item => item.id === idAmbiente);
    return ambiente ? ambiente.nombre : idAmbiente;
  }

  registerServiceIdentity(): void {
    if (!this.selectedAplicacion || !this.identidadesRepository) return;
    if (this.identityForm.invalid) {
      this.identityErrorMessage = 'Seleccione el ambiente e ingrese un Client ID válido.';
      return;
    }
    this.identitySaving = true;
    this.identityErrorMessage = '';
    this.identitySuccessMessage = '';
    this.identidadesRepository.register(this.selectedAplicacion.id, {
      idAmbiente: this.identityForm.value.idAmbiente,
      clientId: this.identityForm.value.clientId.trim()
    }).subscribe({
      next: response => {
        this.identitySuccessMessage = response.mensajes?.[0] || 'Identidad de servicio asociada correctamente.';
        this.identitySaving = false;
        this.identityForm.reset({ idAmbiente: '', clientId: '' });
        this.loadServiceIdentities(this.selectedAplicacion!.id);
      },
      error: err => {
        this.identityErrorMessage = err.message || 'Error al asociar la identidad de servicio.';
        this.identitySaving = false;
      }
    });
  }

  removeServiceIdentity(identity: IdentidadServicio): void {
    if (!this.selectedAplicacion || !this.identidadesRepository) return;
    if (!confirm(`¿Retirar la identidad ${identity.clientId} de esta aplicación?`)) return;
    this.identitySaving = true;
    this.identityErrorMessage = '';
    this.identidadesRepository.remove(this.selectedAplicacion.id, identity.clientId).subscribe({
      next: response => {
        this.identitySuccessMessage = response.mensajes?.[0] || 'Identidad de servicio retirada correctamente.';
        this.identitySaving = false;
        this.loadServiceIdentities(this.selectedAplicacion!.id);
      },
      error: err => {
        this.identityErrorMessage = err.message || 'Error al retirar la identidad de servicio.';
        this.identitySaving = false;
      }
    });
  }

  connectSse(): void {
    const sub = this.eventStream.connect<any>(this.repository.eventsUrl, 'aplicacion', connected => this.isConnected = connected).subscribe({
      next: (data: any) => {
        this.isConnected = true;

        const entity = data.aplicacion;
        const eventType = data.event;

        if (!entity) return;

        switch (eventType) {
          case 'CREATED':
            if (!this.aplicaciones.find(a => a.id === entity.id)) {
              this.aplicaciones = ordenarPorNombre([...this.aplicaciones, entity]);
            }
            break;
          case 'UPDATED':
            this.aplicaciones = ordenarPorNombre(this.aplicaciones.map(a => a.id === entity.id ? entity : a));
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

  copyApplicationId(aplicacion: Aplicacion): void {
    const clipboard = navigator.clipboard;
    if (!clipboard) {
      this.copyUsingDocumentCommand(aplicacion.id);
      return;
    }
    clipboard.writeText(aplicacion.id).then(() => {
      this.errorMessage = '';
      this.successMessage = `ID de aplicación copiado: ${aplicacion.id}`;
    }).catch(() => {
      this.errorMessage = 'No fue posible copiar el ID de la aplicación.';
    });
  }

  private copyUsingDocumentCommand(id: string): void {
    const textarea = document.createElement('textarea');
    textarea.value = id;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();

    let copied = false;
    try {
      copied = document.execCommand('copy');
    } catch {
      copied = false;
    }
    document.body.removeChild(textarea);

    if (copied) {
      this.errorMessage = '';
      this.successMessage = `ID de aplicación copiado: ${id}`;
    } else {
      this.errorMessage = 'No fue posible copiar el ID de la aplicación.';
    }
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
      this.errorMessage = 'El nombre y la organización son obligatorios.';
      return;
    }

    if (![this.aplicacionForm.value.fechaInicio, this.aplicacionForm.value.fechaFinal]
      .every(fecha => fechaLocalValida(fecha || ''))) {
      this.errorMessage = 'Ingrese fechas y horas válidas para su zona horaria.';
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
          this.successMessage = response.mensajes[0] || 'Aplicación actualizada correctamente.';
          this.saving = false;
          this.closeModal();
        },
        error: (err) => {
          this.errorMessage = err.message || 'Error al actualizar la aplicación.';
          this.saving = false;
        }
      });
    } else {
      this.repository.create(data).subscribe({
        next: (response) => {
          this.successMessage = response.mensajes[0] || 'Aplicación creada correctamente.';
          this.saving = false;
          this.closeModal();
        },
        error: (err) => {
          this.errorMessage = err.message || 'Error al crear la aplicación.';
          this.saving = false;
        }
      });
    }
  }

  deleteAplicacion(id: string): void {
    if (!confirm('¿Está seguro de que desea eliminar esta aplicación?')) {
      return;
    }

    this.repository.delete(id).subscribe({
      next: (response) => {
        this.successMessage = response.mensajes[0] || 'Aplicación eliminada correctamente.';
        this.errorMessage = '';
      },
      error: (err) => {
        this.errorMessage = err.message || 'Error al eliminar la aplicación.';
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
        this.successMessage = response.mensajes[0] || `Aplicación ${activa ? 'activada' : 'desactivada'} correctamente.`;
      },
      error: (err) => {
        this.errorMessage = err.message || 'Error al cambiar el estado de la aplicación.';
      }
    });
  }
}
