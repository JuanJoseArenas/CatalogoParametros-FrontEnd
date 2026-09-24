import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EventStreamService } from '../../../../core/realtime/event-stream.service';
import { Organizacion } from '../../domain/organizacion';
import { OrganizacionesRepository } from '../../domain/organizaciones.repository';
import { fechaConZona, fechaParaFormulario, mostrarFechaLocal, fechaLocalValida } from '../../../../shared/utils/date.utils';
import { ConnectionStatusComponent } from '../../../../shared/ui/connection-status/connection-status.component';
import { PageMessagesComponent } from '../../../../shared/ui/page-messages/page-messages.component';
import { OrganizacionFormComponent } from '../components/organizacion-form.component';
import { OrganizacionesTableComponent } from '../components/organizaciones-table.component';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-organizaciones',
    imports: [FormsModule, ConnectionStatusComponent, PageMessagesComponent, OrganizacionFormComponent, OrganizacionesTableComponent],
    template: `
    <div class="organizaciones">
      <div class="page-header">
        <h1>Organizaciones</h1>
        <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
          <app-connection-status [connected]="isConnected" />
          <div class="search-bar">
            <span class="search-icon">🔍</span>
            <input type="text" placeholder="Buscar organizacion..." [(ngModel)]="searchTerm">
          </div>
          <button class="btn btn-primary" (click)="openModal()">+ Nueva</button>
        </div>
      </div>

      <app-page-messages [error]="errorMessage" [success]="successMessage" />

      <app-organizaciones-table
        [organizaciones]="filteredOrganizaciones"
        [loading]="loading"
        [page]="page"
        [pageSize]="pageSize"
        [totalOnPage]="organizaciones.length"
        (edit)="editOrganizacion($event)"
        (remove)="deleteOrganizacion($event)"
        (pageChange)="changePage($event)"
      />
    </div>

    @if (showModal) {
      <app-organizacion-form
        [form]="organizacionForm"
        [editing]="isEditing"
        [saving]="saving"
        (save)="saveOrganizacion()"
        (cancel)="closeModal()"
      />
    }
    `,
    changeDetection: ChangeDetectionStrategy.Eager,
    styles: [`
    .organizaciones {
      max-width: 1200px;
      margin: 0 auto;
    }
  `]
})
export class OrganizacionesComponent implements OnInit, OnDestroy {
  organizaciones: Organizacion[] = [];
  loading = false;
  saving = false;
  showModal = false;
  isEditing = false;
  editingId: string | null = null;
  errorMessage = '';
  successMessage = '';
  organizacionForm: FormGroup;
  searchTerm = '';
  isConnected = false;
  page = 1;
  pageSize = 10;
  readonly mostrarFechaLocal = mostrarFechaLocal;
  private fechasOriginales: { fechaInicio?: string; fechaFinal?: string } = {};
  private subscriptions: Subscription[] = [];

  constructor(private repository: OrganizacionesRepository, private fb: FormBuilder, private eventStream: EventStreamService) {
    this.organizacionForm = this.fb.group({
      nombre: ['', Validators.required],
      fechaInicio: [''],
      fechaFinal: ['']
    });
  }

  ngOnInit(): void {
    this.loadOrganizaciones();
    this.connectSse();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  get filteredOrganizaciones(): Organizacion[] {
    if (!this.searchTerm.trim()) return this.organizaciones;
    return this.organizaciones.filter(org =>
      org.nombre.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  loadOrganizaciones(): void {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.repository.findPage(this.page, this.pageSize).subscribe({
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

  changePage(page: number): void {
    if (page < 1 || this.loading) return;
    this.page = page;
    this.loadOrganizaciones();
  }

  connectSse(): void {
    const sub = this.eventStream.connect<any>(this.repository.eventsUrl, 'organizacion').subscribe({
      next: (data: any) => {
        this.isConnected = true;

        const entity = data.organizacion;
        const eventType = data.event;

        if (!entity) return;

        switch (eventType) {
          case 'CREATED':
            if (!this.organizaciones.find(o => o.id === entity.id)) {
              this.organizaciones = [...this.organizaciones, entity];
            }
            break;
          case 'UPDATED':
            this.organizaciones = this.organizaciones.map(o =>
              o.id === entity.id ? entity : o
            );
            break;
          case 'DELETED':
            this.organizaciones = this.organizaciones.filter(o => o.id !== entity.id);
            break;
        }
      },
      error: () => {
        this.isConnected = false;
      }
    });
    this.subscriptions.push(sub);
  }

  openModal(): void {
    this.showModal = true;
    this.isEditing = false;
    this.editingId = null;
    this.fechasOriginales = {};
    this.organizacionForm.reset({ nombre: '', fechaInicio: '', fechaFinal: '' });
  }

  editOrganizacion(org: Organizacion): void {
    this.showModal = true;
    this.isEditing = true;
    this.editingId = org.id;
    this.fechasOriginales = { fechaInicio: org.fechaInicio, fechaFinal: org.fechaFinal };
    this.organizacionForm.reset({
      nombre: org.nombre,
      fechaInicio: fechaParaFormulario(org.fechaInicio),
      fechaFinal: fechaParaFormulario(org.fechaFinal)
    });
  }

  closeModal(): void {
    this.showModal = false;
    this.isEditing = false;
    this.editingId = null;
    this.fechasOriginales = {};
    this.organizacionForm.reset({ nombre: '', fechaInicio: '', fechaFinal: '' });
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

    if (![this.organizacionForm.value.fechaInicio, this.organizacionForm.value.fechaFinal]
      .every(fecha => fechaLocalValida(fecha || ''))) {
      this.errorMessage = 'Ingrese fechas y horas v?lidas para su zona horaria.';
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const data: { nombre: string; fechaInicio?: string; fechaFinal?: string } = {
      nombre: this.organizacionForm.value.nombre
    };

    if (this.organizacionForm.value.fechaInicio) {
      data.fechaInicio = fechaConZona(this.organizacionForm.value.fechaInicio, this.fechasOriginales.fechaInicio);
    }
    if (this.organizacionForm.value.fechaFinal) {
      data.fechaFinal = fechaConZona(this.organizacionForm.value.fechaFinal, this.fechasOriginales.fechaFinal);
    }

    if (this.isEditing && this.editingId) {
      this.repository.update(this.editingId, data).subscribe({
        next: (response) => {
          this.successMessage = response.mensajes[0] || 'Organizacion actualizada exitosamente';
          this.saving = false;
          this.closeModal();
        },
        error: (err) => {
          this.errorMessage = err.message || 'Error al actualizar la organizacion';
          this.saving = false;
        }
      });
    } else {
      this.repository.create(data).subscribe({
        next: (response) => {
          this.successMessage = response.mensajes[0] || 'Organizacion creada exitosamente';
          this.saving = false;
          this.closeModal();
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

    this.repository.delete(id).subscribe({
      next: (response) => {
        this.successMessage = response.mensajes[0] || 'Organizacion eliminada exitosamente';
        this.errorMessage = '';
      },
      error: (err) => {
        this.errorMessage = err.message || 'Error al eliminar la organizacion';
      }
    });
  }
}
