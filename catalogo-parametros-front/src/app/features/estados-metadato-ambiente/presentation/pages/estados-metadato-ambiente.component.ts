import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription, retry, tap } from 'rxjs';
import { EventStreamService } from '../../../../core/realtime/event-stream.service';
import { PageMessagesComponent } from '../../../../shared/ui/page-messages/page-messages.component';
import { PaginationComponent } from '../../../../shared/ui/pagination/pagination.component';
import { EstadoMetadatoAmbiente, EstadoMetadatoAmbienteEvent } from '../../domain/estado-metadato-ambiente';
import { EstadosMetadatoAmbienteRepository } from '../../domain/estados-metadato-ambiente.repository';

@Component({
  selector: 'app-estados-metadato-ambiente',
  imports: [FormsModule, ReactiveFormsModule, PageMessagesComponent, PaginationComponent],
  templateUrl: './estados-metadato-ambiente.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [`
    :host { display: block; max-width: 1200px; margin: 0 auto; }
    .actions { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
    .connection { color: #64748b; font-size: .85rem; }
    .identifier { overflow-wrap: anywhere; }
  `]
})
export class EstadosMetadatoAmbienteComponent implements OnInit, OnDestroy {
  estadosMetadatoAmbiente: EstadoMetadatoAmbiente[] = [];
  page = 1;
  readonly pageSize = 10;
  searchTerm = '';
  loading = false;
  saving = false;
  consulting = false;
  deletingId: string | null = null;
  showModal = false;
  editingId: string | null = null;
  detalle: EstadoMetadatoAmbiente | null = null;
  errorMessage = '';
  formError = '';
  successMessage = '';
  connectionStatus = 'Esperando cambios en tiempo real';
  readonly estadoMetadatoAmbienteForm = new FormGroup({
    nombre: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/\S/)] })
  });
  private readonly subscriptions = new Subscription();
  private pageRequest?: Subscription;

  constructor(private readonly repository: EstadosMetadatoAmbienteRepository, private readonly eventStream: EventStreamService) {}

  ngOnInit(): void {
    this.loadEstadosMetadatoAmbiente();
    this.subscriptions.add(this.eventStream.connect<EstadoMetadatoAmbienteEvent>(this.repository.eventsUrl, 'estadometadatoambiente').pipe(
      tap({ error: () => this.connectionStatus = 'Reconectando cambios en tiempo real...' }),
      retry({ delay: 3000 })
    ).subscribe(event => {
      this.connectionStatus = 'Recibiendo cambios en tiempo real';
      if (event.estadoMetadatoAmbiente && ['CREATED', 'UPDATED', 'DELETED'].includes(event.event)) {
        if (this.detalle?.id === event.estadoMetadatoAmbiente.id) {
          this.detalle = event.event === 'DELETED' ? null : event.estadoMetadatoAmbiente;
        }
        this.loadEstadosMetadatoAmbiente();
      }
    }));
  }

  ngOnDestroy(): void { this.subscriptions.unsubscribe(); }

  get filteredEstadosMetadatoAmbiente(): EstadoMetadatoAmbiente[] {
    const term = this.searchTerm.trim().toLocaleLowerCase();
    return this.estadosMetadatoAmbiente.filter(estadoMetadatoAmbiente => estadoMetadatoAmbiente.nombre.toLocaleLowerCase().includes(term));
  }

  loadEstadosMetadatoAmbiente(): void {
    this.pageRequest?.unsubscribe();
    this.loading = true;
    this.errorMessage = '';
    this.pageRequest = this.repository.findPage(this.page, this.pageSize).subscribe({
      next: estadosMetadatoAmbiente => {
        this.estadosMetadatoAmbiente = estadosMetadatoAmbiente;
        this.loading = false;
        if (!estadosMetadatoAmbiente.length && this.page > 1) {
          this.page--;
          this.loadEstadosMetadatoAmbiente();
        }
      },
      error: (error: Error) => {
        this.loading = false;
        this.errorMessage = error.message || 'No se pudieron cargar los estados de metadatos por ambiente.';
      }
    });
    this.subscriptions.add(this.pageRequest);
  }

  changePage(page: number): void {
    if (page < 1 || this.loading) return;
    this.page = page;
    this.loadEstadosMetadatoAmbiente();
  }

  openModal(estadoMetadatoAmbiente?: EstadoMetadatoAmbiente): void {
    this.editingId = estadoMetadatoAmbiente?.id ?? null;
    this.estadoMetadatoAmbienteForm.reset({ nombre: estadoMetadatoAmbiente?.nombre ?? '' });
    this.formError = '';
    this.showModal = true;
  }

  closeModal(): void {
    if (this.saving) return;
    this.showModal = false;
    this.editingId = null;
  }

  saveEstadoMetadatoAmbiente(): void {
    if (this.saving) return;
    this.estadoMetadatoAmbienteForm.markAllAsTouched();
    if (this.estadoMetadatoAmbienteForm.invalid) return;
    this.saving = true;
    this.formError = '';
    this.successMessage = '';
    const input = { nombre: this.estadoMetadatoAmbienteForm.controls.nombre.value.trim() };
    const request = this.editingId
      ? this.repository.update(this.editingId, input)
      : this.repository.create(input);
    this.subscriptions.add(request.subscribe({
      next: response => {
        this.successMessage = response.mensajes[0] || 'Estado guardado.';
        this.saving = false;
        this.closeModal();
        this.loadEstadosMetadatoAmbiente();
      },
      error: (error: Error) => {
        this.saving = false;
        this.formError = error.message || 'No se pudo guardar el estado de metadato por ambiente.';
      }
    }));
  }

  consultarEstadoMetadatoAmbiente(id: string): void {
    if (this.consulting) return;
    this.consulting = true;
    this.errorMessage = '';
    this.subscriptions.add(this.repository.findById(id).subscribe({
      next: estadoMetadatoAmbiente => { this.detalle = estadoMetadatoAmbiente; this.consulting = false; },
      error: (error: Error) => {
        this.consulting = false;
        this.errorMessage = error.message || 'No se pudo consultar el estado de metadato por ambiente.';
      }
    }));
  }

  deleteEstadoMetadatoAmbiente(estadoMetadatoAmbiente: EstadoMetadatoAmbiente): void {
    if (this.deletingId || !window.confirm(`¿Está seguro de eliminar el estado de metadato por ambiente "${estadoMetadatoAmbiente.nombre}"?`)) return;
    this.deletingId = estadoMetadatoAmbiente.id;
    this.errorMessage = '';
    this.successMessage = '';
    this.subscriptions.add(this.repository.delete(estadoMetadatoAmbiente.id).subscribe({
      next: response => {
        this.deletingId = null;
        this.successMessage = response.mensajes[0] || 'Estado eliminado.';
        this.loadEstadosMetadatoAmbiente();
      },
      error: (error: Error) => {
        this.deletingId = null;
        this.errorMessage = error.message || 'No se pudo eliminar el estado de metadato por ambiente.';
      }
    }));
  }
}

