import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription, retry, tap } from 'rxjs';
import { EventStreamService } from '../../../../core/realtime/event-stream.service';
import { PageMessagesComponent } from '../../../../shared/ui/page-messages/page-messages.component';
import { PaginationComponent } from '../../../../shared/ui/pagination/pagination.component';
import { EstadoAmbiente, EstadoAmbienteEvent } from '../../domain/estado-ambiente';
import { EstadosAmbienteRepository } from '../../domain/estados-ambiente.repository';

@Component({
  selector: 'app-estados-ambiente',
  imports: [FormsModule, ReactiveFormsModule, PageMessagesComponent, PaginationComponent],
  templateUrl: './estados-ambiente.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [`
    :host { display: block; max-width: 1200px; margin: 0 auto; }
    .actions { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
    .connection { color: #64748b; font-size: .85rem; }
    .identifier { overflow-wrap: anywhere; }
  `]
})
export class EstadosAmbienteComponent implements OnInit, OnDestroy {
  estadosAmbiente: EstadoAmbiente[] = [];
  page = 1;
  readonly pageSize = 10;
  searchTerm = '';
  loading = false;
  saving = false;
  consulting = false;
  deletingId: string | null = null;
  showModal = false;
  editingId: string | null = null;
  detalle: EstadoAmbiente | null = null;
  errorMessage = '';
  formError = '';
  successMessage = '';
  connectionStatus = 'Esperando cambios en tiempo real';
  readonly estadoAmbienteForm = new FormGroup({
    nombre: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/\S/)] })
  });
  private readonly subscriptions = new Subscription();
  private pageRequest?: Subscription;

  constructor(private readonly repository: EstadosAmbienteRepository, private readonly eventStream: EventStreamService) {}

  ngOnInit(): void {
    this.loadEstadosAmbiente();
    this.subscriptions.add(this.eventStream.connect<EstadoAmbienteEvent>(this.repository.eventsUrl, 'estadoambiente').pipe(
      tap({ error: () => this.connectionStatus = 'Reconectando cambios en tiempo real...' }),
      retry({ delay: 3000 })
    ).subscribe(event => {
      this.connectionStatus = 'Recibiendo cambios en tiempo real';
      if (event.estadoAmbiente && ['CREATED', 'UPDATED', 'DELETED'].includes(event.event)) {
        if (this.detalle?.id === event.estadoAmbiente.id) {
          this.detalle = event.event === 'DELETED' ? null : event.estadoAmbiente;
        }
        this.loadEstadosAmbiente();
      }
    }));
  }

  ngOnDestroy(): void { this.subscriptions.unsubscribe(); }

  get filteredEstadosAmbiente(): EstadoAmbiente[] {
    const term = this.searchTerm.trim().toLocaleLowerCase();
    return this.estadosAmbiente.filter(estadoAmbiente => estadoAmbiente.nombre.toLocaleLowerCase().includes(term));
  }

  loadEstadosAmbiente(): void {
    this.pageRequest?.unsubscribe();
    this.loading = true;
    this.errorMessage = '';
    this.pageRequest = this.repository.findPage(this.page, this.pageSize).subscribe({
      next: estadosAmbiente => {
        this.estadosAmbiente = estadosAmbiente;
        this.loading = false;
        if (!estadosAmbiente.length && this.page > 1) {
          this.page--;
          this.loadEstadosAmbiente();
        }
      },
      error: (error: Error) => {
        this.loading = false;
        this.errorMessage = error.message || 'No se pudieron cargar los estados de ambiente.';
      }
    });
    this.subscriptions.add(this.pageRequest);
  }

  changePage(page: number): void {
    if (page < 1 || this.loading) return;
    this.page = page;
    this.loadEstadosAmbiente();
  }

  openModal(estadoAmbiente?: EstadoAmbiente): void {
    this.editingId = estadoAmbiente?.id ?? null;
    this.estadoAmbienteForm.reset({ nombre: estadoAmbiente?.nombre ?? '' });
    this.formError = '';
    this.showModal = true;
  }

  closeModal(): void {
    if (this.saving) return;
    this.showModal = false;
    this.editingId = null;
  }

  saveEstadoAmbiente(): void {
    if (this.saving) return;
    this.estadoAmbienteForm.markAllAsTouched();
    if (this.estadoAmbienteForm.invalid) return;
    this.saving = true;
    this.formError = '';
    this.successMessage = '';
    const input = { nombre: this.estadoAmbienteForm.controls.nombre.value.trim() };
    const request = this.editingId
      ? this.repository.update(this.editingId, input)
      : this.repository.create(input);
    this.subscriptions.add(request.subscribe({
      next: response => {
        this.successMessage = response.mensajes[0] || 'Estado guardado.';
        this.saving = false;
        this.closeModal();
        this.loadEstadosAmbiente();
      },
      error: (error: Error) => {
        this.saving = false;
        this.formError = error.message || 'No se pudo guardar el estado de ambiente.';
      }
    }));
  }

  consultarEstadoAmbiente(id: string): void {
    if (this.consulting) return;
    this.consulting = true;
    this.errorMessage = '';
    this.subscriptions.add(this.repository.findById(id).subscribe({
      next: estadoAmbiente => { this.detalle = estadoAmbiente; this.consulting = false; },
      error: (error: Error) => {
        this.consulting = false;
        this.errorMessage = error.message || 'No se pudo consultar el estado de ambiente.';
      }
    }));
  }

  deleteEstadoAmbiente(estadoAmbiente: EstadoAmbiente): void {
    if (this.deletingId || !window.confirm(`¿Está seguro de eliminar el estado de ambiente "${estadoAmbiente.nombre}"?`)) return;
    this.deletingId = estadoAmbiente.id;
    this.errorMessage = '';
    this.successMessage = '';
    this.subscriptions.add(this.repository.delete(estadoAmbiente.id).subscribe({
      next: response => {
        this.deletingId = null;
        this.successMessage = response.mensajes[0] || 'Estado eliminado.';
        this.loadEstadosAmbiente();
      },
      error: (error: Error) => {
        this.deletingId = null;
        this.errorMessage = error.message || 'No se pudo eliminar el estado de ambiente.';
      }
    }));
  }
}

