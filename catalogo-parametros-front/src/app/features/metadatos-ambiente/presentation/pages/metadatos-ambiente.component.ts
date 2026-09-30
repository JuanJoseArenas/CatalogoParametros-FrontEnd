import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription, forkJoin, retry, tap } from 'rxjs';
import { EventStreamService } from '../../../../core/realtime/event-stream.service';
import { PageMessagesComponent } from '../../../../shared/ui/page-messages/page-messages.component';
import { PaginationComponent } from '../../../../shared/ui/pagination/pagination.component';
import { loadAllPages } from '../../../../shared/utils/load-all-pages';
import { Ambiente } from '../../../ambientes/domain/ambiente';
import { AmbientesRepository } from '../../../ambientes/domain/ambientes.repository';
import { EstadoMetadatoAmbiente } from '../../../estados-metadato-ambiente/domain/estado-metadato-ambiente';
import { EstadosMetadatoAmbienteRepository } from '../../../estados-metadato-ambiente/domain/estados-metadato-ambiente.repository';
import { Parametro } from '../../../parametros/domain/parametro';
import { ParametrosRepository } from '../../../parametros/domain/parametros.repository';
import { MetadatoAmbiente, MetadatoAmbienteEvent } from '../../domain/metadato-ambiente';
import { MetadatosAmbienteRepository } from '../../domain/metadatos-ambiente.repository';

@Component({
  selector: 'app-metadatos-ambiente',
  imports: [FormsModule, ReactiveFormsModule, RouterLink, PageMessagesComponent, PaginationComponent],
  templateUrl: './metadatos-ambiente.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [`
    :host { display: block; max-width: 1200px; margin: 0 auto; }
    .actions { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
    .connection, .help { color: #64748b; font-size: .85rem; }
    dd { overflow-wrap: anywhere; }
  `]
})
export class MetadatosAmbienteComponent implements OnInit, OnDestroy {
  metadatos: MetadatoAmbiente[] = [];
  ambientes: Ambiente[] = [];
  parametros: Parametro[] = [];
  estados: EstadoMetadatoAmbiente[] = [];
  page = 1;
  readonly pageSize = 10;
  searchTerm = '';
  loading = false;
  loadingCatalogos = false;
  catalogosDisponibles = false;
  saving = false;
  consulting = false;
  deletingId: string | null = null;
  editingId: string | null = null;
  showModal = false;
  detalle: MetadatoAmbiente | null = null;
  errorMessage = '';
  catalogError = '';
  formError = '';
  successMessage = '';
  connectionStatus = 'Esperando cambios en tiempo real';
  readonly metadatoForm = new FormGroup({
    idParametro: new FormControl('', { nonNullable: true, validators: Validators.required }),
    idAmbiente: new FormControl('', { nonNullable: true, validators: Validators.required }),
    idEstadoMetadatoAmbiente: new FormControl('', { nonNullable: true, validators: Validators.required })
  });
  private readonly subscriptions = new Subscription();
  private pageRequest?: Subscription;
  private catalogRequest?: Subscription;

  constructor(
    private readonly repository: MetadatosAmbienteRepository,
    private readonly ambientesRepository: AmbientesRepository,
    private readonly estadosRepository: EstadosMetadatoAmbienteRepository,
    private readonly parametrosRepository: ParametrosRepository,
    private readonly eventStream: EventStreamService
  ) {}

  ngOnInit(): void {
    this.loadMetadatos();
    this.loadCatalogos();
    this.subscriptions.add(this.eventStream.connect<MetadatoAmbienteEvent>(this.repository.eventsUrl, 'metadatoambiente').pipe(
      tap({ error: () => this.connectionStatus = 'Reconectando cambios en tiempo real...' }),
      retry({ delay: 3000 })
    ).subscribe(event => {
      this.connectionStatus = 'Recibiendo cambios en tiempo real';
      if (!event.metadatoAmbiente || !['CREATED', 'UPDATED', 'DELETED'].includes(event.event)) return;
      if (this.detalle?.id === event.metadatoAmbiente.id) {
        this.detalle = event.event === 'DELETED' ? null : event.metadatoAmbiente;
      }
      this.loadMetadatos();
      this.loadCatalogos();
    }));
    for (const [url, name] of [
      [this.ambientesRepository.eventsUrl, 'ambiente'],
      [this.estadosRepository.eventsUrl, 'estadometadatoambiente'],
      [this.parametrosRepository.eventsUrl, 'parametro']
    ]) {
      this.subscriptions.add(this.eventStream.connect<unknown>(url, name).pipe(
        retry({ delay: 3000 })
      ).subscribe(() => this.loadCatalogos()));
    }
  }

  ngOnDestroy(): void { this.subscriptions.unsubscribe(); }

  nombre(items: { id: string; nombre: string }[], id: string): string {
    return items.find(item => item.id === id)?.nombre ?? id;
  }

  get filteredMetadatos(): MetadatoAmbiente[] {
    const term = this.searchTerm.trim().toLocaleLowerCase();
    return this.metadatos.filter(item => [
      this.nombre(this.parametros, item.idParametro),
      this.nombre(this.ambientes, item.idAmbiente),
      this.nombre(this.estados, item.idEstadoMetadatoAmbiente)
    ].some(value => value.toLocaleLowerCase().includes(term)));
  }

  loadCatalogos(): void {
    this.catalogRequest?.unsubscribe();
    this.loadingCatalogos = true;
    this.catalogosDisponibles = false;
    this.catalogError = '';
    this.catalogRequest = forkJoin({
      ambientes: loadAllPages((page, size) => this.ambientesRepository.findPage(page, size)),
      estados: loadAllPages((page, size) => this.estadosRepository.findPage(page, size)),
      parametros: loadAllPages((page, size) => this.parametrosRepository.findPage(page, size))
    }).subscribe({
      next: data => {
        this.ambientes = data.ambientes;
        this.estados = data.estados;
        this.parametros = data.parametros;
        this.loadingCatalogos = false;
        this.catalogosDisponibles = true;
      },
      error: (error: Error) => {
        this.loadingCatalogos = false;
        this.catalogError = error.message || 'No se pudieron cargar los catálogos relacionados.';
      }
    });
    this.subscriptions.add(this.catalogRequest);
  }

  loadMetadatos(): void {
    this.pageRequest?.unsubscribe();
    this.loading = true;
    this.errorMessage = '';
    this.pageRequest = this.repository.findPage(this.page, this.pageSize).subscribe({
      next: data => {
        this.metadatos = data;
        this.loading = false;
        if (!data.length && this.page > 1) { this.page--; this.loadMetadatos(); }
      },
      error: (error: Error) => {
        this.loading = false;
        this.errorMessage = error.message || 'No se pudieron cargar los metadatos por ambiente.';
      }
    });
    this.subscriptions.add(this.pageRequest);
  }

  changePage(page: number): void {
    if (page < 1 || this.loading) return;
    this.page = page;
    this.loadMetadatos();
  }

  openModal(item?: MetadatoAmbiente): void {
    this.editingId = item?.id ?? null;
    this.metadatoForm.reset({
      idParametro: item?.idParametro ?? '',
      idAmbiente: item?.idAmbiente ?? '',
      idEstadoMetadatoAmbiente: item?.idEstadoMetadatoAmbiente ?? ''
    });
    this.formError = '';
    this.showModal = true;
    this.loadCatalogos();
  }

  closeModal(): void {
    if (this.saving) return;
    this.showModal = false;
    this.editingId = null;
  }

  saveMetadato(): void {
    if (this.saving || !this.catalogosDisponibles) return;
    this.metadatoForm.markAllAsTouched();
    if (this.metadatoForm.invalid) return;
    const input = this.metadatoForm.getRawValue();
    if (!this.parametros.some(item => item.id === input.idParametro)
        || !this.ambientes.some(item => item.id === input.idAmbiente)
        || !this.estados.some(item => item.id === input.idEstadoMetadatoAmbiente)) {
      this.formError = 'Una de las opciones seleccionadas ya no está disponible. Seleccione una opción vigente.';
      return;
    }
    this.saving = true;
    this.formError = '';
    this.successMessage = '';
    const request = this.editingId ? this.repository.update(this.editingId, input) : this.repository.create(input);
    this.subscriptions.add(request.subscribe({
      next: response => {
        this.successMessage = response.mensajes[0] || 'Metadato de ambiente guardado.';
        this.saving = false;
        this.closeModal();
        this.loadMetadatos();
      },
      error: (error: Error) => {
        this.saving = false;
        this.formError = error.message || 'No se pudo guardar el metadato de ambiente.';
      }
    }));
  }

  consultarMetadato(id: string): void {
    if (this.consulting) return;
    this.consulting = true;
    this.errorMessage = '';
    this.subscriptions.add(this.repository.findById(id).subscribe({
      next: data => { this.detalle = data; this.consulting = false; },
      error: (error: Error) => {
        this.consulting = false;
        this.errorMessage = error.message || 'No se pudo consultar el metadato de ambiente.';
      }
    }));
  }

  deleteMetadato(item: MetadatoAmbiente): void {
    if (this.deletingId || !window.confirm('¿Está seguro de eliminar esta relación entre parámetro y ambiente?')) return;
    this.deletingId = item.id;
    this.errorMessage = '';
    this.successMessage = '';
    this.subscriptions.add(this.repository.delete(item.id).subscribe({
      next: response => {
        this.deletingId = null;
        this.successMessage = response.mensajes[0] || 'Metadato de ambiente eliminado.';
        this.loadMetadatos();
      },
      error: (error: Error) => {
        this.deletingId = null;
        this.errorMessage = error.message || 'No se pudo eliminar el metadato de ambiente.';
      }
    }));
  }
}

