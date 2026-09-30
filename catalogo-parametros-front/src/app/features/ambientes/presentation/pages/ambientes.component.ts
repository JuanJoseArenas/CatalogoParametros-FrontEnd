import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription, retry, tap } from 'rxjs';
import { EventStreamService } from '../../../../core/realtime/event-stream.service';
import { PageMessagesComponent } from '../../../../shared/ui/page-messages/page-messages.component';
import { PaginationComponent } from '../../../../shared/ui/pagination/pagination.component';
import { Ambiente, AmbienteEvent } from '../../domain/ambiente';
import { AmbientesRepository } from '../../domain/ambientes.repository';

@Component({
  selector: 'app-ambientes',
  imports: [FormsModule, ReactiveFormsModule, PageMessagesComponent, PaginationComponent],
  templateUrl: './ambientes.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [`
    :host { display: block; max-width: 1200px; margin: 0 auto; }
    .actions { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
    .connection { color: #64748b; font-size: .85rem; }
    .identifier { overflow-wrap: anywhere; }
  `]
})
export class AmbientesComponent implements OnInit, OnDestroy {
  ambientes: Ambiente[] = [];
  page = 1;
  readonly pageSize = 10;
  searchTerm = '';
  loading = false;
  saving = false;
  consulting = false;
  deletingId: string | null = null;
  showModal = false;
  editingId: string | null = null;
  detalle: Ambiente | null = null;
  errorMessage = '';
  formError = '';
  successMessage = '';
  connectionStatus = 'Esperando cambios en tiempo real';
  readonly ambienteForm = new FormGroup({
    nombre: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/\S/)] })
  });
  private readonly subscriptions = new Subscription();
  private pageRequest?: Subscription;

  constructor(private readonly repository: AmbientesRepository, private readonly eventStream: EventStreamService) {}

  ngOnInit(): void {
    this.loadAmbientes();
    this.subscriptions.add(this.eventStream.connect<AmbienteEvent>(this.repository.eventsUrl, 'ambiente').pipe(
      tap({ error: () => this.connectionStatus = 'Reconectando cambios en tiempo real...' }),
      retry({ delay: 3000 })
    ).subscribe(event => {
      this.connectionStatus = 'Recibiendo cambios en tiempo real';
      if (event.ambiente && ['CREATED', 'UPDATED', 'DELETED'].includes(event.event)) {
        if (this.detalle?.id === event.ambiente.id) {
          this.detalle = event.event === 'DELETED' ? null : event.ambiente;
        }
        this.loadAmbientes();
      }
    }));
  }

  ngOnDestroy(): void { this.subscriptions.unsubscribe(); }

  get filteredAmbientes(): Ambiente[] {
    const term = this.searchTerm.trim().toLocaleLowerCase();
    return this.ambientes.filter(ambiente => ambiente.nombre.toLocaleLowerCase().includes(term));
  }

  loadAmbientes(): void {
    this.pageRequest?.unsubscribe();
    this.loading = true;
    this.errorMessage = '';
    this.pageRequest = this.repository.findPage(this.page, this.pageSize).subscribe({
      next: ambientes => {
        this.ambientes = ambientes;
        this.loading = false;
        if (!ambientes.length && this.page > 1) {
          this.page--;
          this.loadAmbientes();
        }
      },
      error: (error: Error) => {
        this.loading = false;
        this.errorMessage = error.message || 'No se pudieron cargar los ambientes.';
      }
    });
    this.subscriptions.add(this.pageRequest);
  }

  changePage(page: number): void {
    if (page < 1 || this.loading) return;
    this.page = page;
    this.loadAmbientes();
  }

  openModal(ambiente?: Ambiente): void {
    this.editingId = ambiente?.id ?? null;
    this.ambienteForm.reset({ nombre: ambiente?.nombre ?? '' });
    this.formError = '';
    this.showModal = true;
  }

  closeModal(): void {
    if (this.saving) return;
    this.showModal = false;
    this.editingId = null;
  }

  saveAmbiente(): void {
    if (this.saving) return;
    this.ambienteForm.markAllAsTouched();
    if (this.ambienteForm.invalid) return;
    this.saving = true;
    this.formError = '';
    this.successMessage = '';
    const input = { nombre: this.ambienteForm.controls.nombre.value.trim() };
    const request = this.editingId
      ? this.repository.update(this.editingId, input)
      : this.repository.create(input);
    this.subscriptions.add(request.subscribe({
      next: response => {
        this.successMessage = response.mensajes[0] || 'Ambiente guardado.';
        this.saving = false;
        this.closeModal();
        this.loadAmbientes();
      },
      error: (error: Error) => {
        this.saving = false;
        this.formError = error.message || 'No se pudo guardar el ambiente.';
      }
    }));
  }

  consultarAmbiente(id: string): void {
    if (this.consulting) return;
    this.consulting = true;
    this.errorMessage = '';
    this.subscriptions.add(this.repository.findById(id).subscribe({
      next: ambiente => { this.detalle = ambiente; this.consulting = false; },
      error: (error: Error) => {
        this.consulting = false;
        this.errorMessage = error.message || 'No se pudo consultar el ambiente.';
      }
    }));
  }

  deleteAmbiente(ambiente: Ambiente): void {
    if (this.deletingId || !window.confirm(`¿Está seguro de eliminar el ambiente "${ambiente.nombre}"?`)) return;
    this.deletingId = ambiente.id;
    this.errorMessage = '';
    this.successMessage = '';
    this.subscriptions.add(this.repository.delete(ambiente.id).subscribe({
      next: response => {
        this.deletingId = null;
        this.successMessage = response.mensajes[0] || 'Ambiente eliminado.';
        this.loadAmbientes();
      },
      error: (error: Error) => {
        this.deletingId = null;
        this.errorMessage = error.message || 'No se pudo eliminar el ambiente.';
      }
    }));
  }
}

