
import { Component, OnDestroy, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { forkJoin, Subscription } from 'rxjs';
import { EventStreamService } from '../../../../core/realtime/event-stream.service';
import { Metadato, TipoMetadato } from '../../domain/metadato';
import { MetadatosRepository } from '../../domain/metadatos.repository';
import { Parametro } from '../../../parametros/domain/parametro';
import { ParametrosRepository } from '../../../parametros/domain/parametros.repository';
import { ConnectionStatusComponent } from '../../../../shared/ui/connection-status/connection-status.component';
import { PageMessagesComponent } from '../../../../shared/ui/page-messages/page-messages.component';
import { MetadatoFormComponent } from '../components/metadato-form.component';

@Component({
    selector: 'app-metadatos',
    imports: [FormsModule, ConnectionStatusComponent, PageMessagesComponent, MetadatoFormComponent],
    template: `
    <div class="metadatos">
      <div class="page-header">
        <h1>Metadatos</h1>
        <div class="header-actions">
          <app-connection-status [connected]="isConnected" />
          <div class="search-bar">
            <span class="search-icon">🔍</span>
            <input type="text" placeholder="Buscar metadato..." [(ngModel)]="searchTerm">
          </div>
          <button class="btn btn-primary" (click)="openModal()">+ Nuevo</button>
        </div>
      </div>

      <app-page-messages [error]="errorMessage" [success]="successMessage" />

      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Lista de Metadatos</h2>
          <span class="record-count">{{ filteredMetadatos.length }} registro(s)</span>
        </div>
        @if (filteredMetadatos.length > 0) {
          <div class="table-container">
            <table>
              <thead><tr><th>Parámetro</th><th>Tipo de Metadato</th><th>Valor</th><th>Acciones</th></tr></thead>
              <tbody>
                @for (metadato of filteredMetadatos; track metadato) {
                  <tr>
                    <td>{{ getParametroNombre(metadato.idParametro) }}</td>
                    <td>{{ getTipoNombre(metadato.idTipoMetadato) }}</td>
                    <td><span class="value-preview" [title]="formatValor(metadato.valor)">{{ formatValor(metadato.valor) }}</span></td>
                    <td>
                      <button class="btn btn-warning btn-sm" (click)="editMetadato(metadato)">Editar</button>
                      <button class="btn btn-danger btn-sm" (click)="deleteMetadato(metadato.id)">Eliminar</button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
        @if (filteredMetadatos.length === 0 && !loading) {
          <div class="empty-state">
            <div class="empty-state-icon">🧩</div><h3>No hay metadatos</h3><p>Comienza creando un nuevo metadato</p>
          </div>
        }
        @if (loading) {
          <div class="loading"><div class="spinner"></div></div>
        }
      </div>
    </div>

    @if (showModal) {
      <app-metadato-form
        [form]="metadatoForm" [parametros]="parametros" [tipos]="tiposMetadato"
        [selectedType]="selectedTipo" [editing]="isEditing" [saving]="saving"
        (typeChange)="onTipoChange()" (save)="saveMetadato()" (cancel)="closeModal()"
      />
    }
    `,
    changeDetection: ChangeDetectionStrategy.Eager,
    styles: [`
    .metadatos { max-width: 1200px; margin: 0 auto; }
    .header-actions { display: flex; align-items: center; gap: 12px; }
    .header-actions { flex-wrap: wrap; }
    .record-count { font-size: .85rem; color: #64748b; font-weight: 500; }
    .value-preview { display: block; max-width: 420px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: monospace; }
  `]
})
export class MetadatosComponent implements OnInit, OnDestroy {
  metadatos: Metadato[] = [];
  parametros: Parametro[] = [];
  tiposMetadato: TipoMetadato[] = [];
  metadatoForm: FormGroup;
  loading = false;
  saving = false;
  showModal = false;
  isEditing = false;
  editingId: string | null = null;
  isConnected = false;
  errorMessage = '';
  successMessage = '';
  searchTerm = '';
  private subscriptions: Subscription[] = [];

  constructor(private repository: MetadatosRepository, private parametrosRepository: ParametrosRepository, private eventStream: EventStreamService, fb: FormBuilder) {
    this.metadatoForm = fb.group({ idParametro: ['', Validators.required], idTipoMetadato: ['', Validators.required], valor: ['', Validators.required] });
  }

  ngOnInit(): void {
    this.loadMetadatos();
    forkJoin({ parametros: this.parametrosRepository.findAll(), tipos: this.repository.findTypes() }).subscribe({
      next: data => { this.parametros = data.parametros; this.tiposMetadato = data.tipos; },
      error: err => { this.errorMessage = err.message || 'Error al cargar los datos del formulario'; }
    });
    this.connectSse();
  }

  ngOnDestroy(): void { this.subscriptions.forEach(subscription => subscription.unsubscribe()); }

  get filteredMetadatos(): Metadato[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return this.metadatos;
    return this.metadatos.filter(item => this.formatValor(item.valor).toLowerCase().includes(term) || this.getParametroNombre(item.idParametro).toLowerCase().includes(term) || this.getTipoNombre(item.idTipoMetadato).toLowerCase().includes(term));
  }

  get selectedTipo(): string {
    const id = this.metadatoForm.get('idTipoMetadato')?.value;
    return (this.tiposMetadato.find(item => item.id === id)?.tipo || '').trim().toLowerCase();
  }

  loadMetadatos(): void {
    this.loading = true; this.errorMessage = '';
    this.repository.findAll().subscribe({
      next: data => { this.metadatos = data; this.loading = false; },
      error: err => { this.errorMessage = err.message || 'Error al cargar los metadatos'; this.loading = false; }
    });
  }

  getParametroNombre(id: string): string { return this.parametros.find(item => item.id === id)?.nombre || 'N/A'; }
  getTipoNombre(id: string): string { return this.tiposMetadato.find(item => item.id === id)?.tipo || 'N/A'; }
  formatValor(valor: Metadato['valor']): string {
    return typeof valor === 'string' ? valor : JSON.stringify(valor);
  }
  connectSse(): void {
    const subscription = this.eventStream.connect<any>(this.repository.eventsUrl, 'metadato').subscribe({
      next: data => {
        this.isConnected = true;
        const entity = data.metadato as Metadato;
        if (!entity) return;
        if (data.event === 'CREATED' && !this.metadatos.some(item => item.id === entity.id)) this.metadatos = [...this.metadatos, entity];
        if (data.event === 'UPDATED') this.metadatos = this.metadatos.map(item => item.id === entity.id ? entity : item);
        if (data.event === 'DELETED') this.metadatos = this.metadatos.filter(item => item.id !== entity.id);
      },
      error: () => { this.isConnected = false; }
    });
    this.subscriptions.push(subscription);
  }

  openModal(): void {
    this.showModal = true;
    this.isEditing = false;
    this.editingId = null;
    this.metadatoForm.reset({ idParametro: '', idTipoMetadato: '', valor: '' });
  }

  onTipoChange(): void {
    this.metadatoForm.get('valor')?.reset('');
    this.errorMessage = '';
  }

  editMetadato(metadato: Metadato): void {
    this.showModal = true;
    this.isEditing = true;
    this.editingId = metadato.id;
    this.metadatoForm.reset({
      idParametro: metadato.idParametro,
      idTipoMetadato: metadato.idTipoMetadato,
      valor: typeof metadato.valor === 'string' ? metadato.valor : JSON.stringify(metadato.valor, null, 2)
    });
  }

  closeModal(): void {
    this.showModal = false;
    this.isEditing = false;
    this.editingId = null;
    this.metadatoForm.reset({ idParametro: '', idTipoMetadato: '', valor: '' });
  }
  closeModalOnOverlay(event: Event): void { if (event.target === event.currentTarget) this.closeModal(); }

  saveMetadato(): void {
    if (this.metadatoForm.invalid) { this.metadatoForm.markAllAsTouched(); this.errorMessage = 'Todos los campos son requeridos'; return; }
    const valor = this.buildValor();
    if (valor === undefined) return;

    this.saving = true; this.errorMessage = ''; this.successMessage = '';
    const formValue = this.metadatoForm.getRawValue();
    const data = { idParametro: formValue.idParametro, idTipoMetadato: formValue.idTipoMetadato, valor };
    const request = this.isEditing && this.editingId
      ? this.repository.update(this.editingId, data)
      : this.repository.create(data);
    request.subscribe({
      next: response => {
        this.successMessage = response.mensajes?.[0] || (this.isEditing ? 'Metadato actualizado exitosamente' : 'Metadato creado exitosamente');
        this.saving = false; this.closeModal(); this.loadMetadatos();
      },
      error: err => { this.errorMessage = err.message || (this.isEditing ? 'Error al actualizar el metadato' : 'Error al crear el metadato'); this.saving = false; }
    });
  }

  private buildValor(): string | Record<string, unknown> | unknown[] | undefined {
    const rawValue = String(this.metadatoForm.get('valor')?.value ?? '').trim();

    if (this.selectedTipo === 'json') {
      try {
        const parsed: unknown = JSON.parse(rawValue);
        if (typeof parsed !== 'object' || parsed === null) {
          this.errorMessage = 'El valor debe ser un objeto o arreglo JSON';
          return undefined;
        }
        return parsed as Record<string, unknown> | unknown[];
      } catch {
        this.errorMessage = 'El valor ingresado no es un JSON válido';
        return undefined;
      }
    }

    if (this.selectedTipo === 'date' && !this.isValidDate(rawValue)) {
      this.errorMessage = 'El valor debe ser una fecha válida en formato yyyy-MM-dd';
      return undefined;
    }

    return rawValue;
  }

  private isValidDate(value: string): boolean {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return false;
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  }

  deleteMetadato(id: string): void {
    if (!confirm('¿Está seguro de eliminar este metadato?')) return;
    this.errorMessage = ''; this.successMessage = '';
    this.repository.delete(id).subscribe({
      next: response => { this.successMessage = response.mensajes?.[0] || 'Metadato eliminado exitosamente'; this.loadMetadatos(); },
      error: err => { this.errorMessage = err.message || 'Error al eliminar el metadato'; }
    });
  }
}
