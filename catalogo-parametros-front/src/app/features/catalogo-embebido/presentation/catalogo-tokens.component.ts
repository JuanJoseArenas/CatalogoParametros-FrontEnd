import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom, forkJoin } from 'rxjs';
import { PARAMETROS_UI_OPTIONS } from '../../../../microfrontend/config';
import { fechaConZona } from '../../../shared/utils/date.utils';
import { generarSecretoIntegracion, propiedadesIntegracion } from '../../tokens/domain/credencial-integracion';
import type { CatalogoEstadoToken, CatalogoToken } from '../domain/token-administration';
import { HttpCatalogoAplicacionService } from '../infrastructure/http-catalogo-aplicacion.service';

@Component({
  selector: 'uco-catalogo-tokens',
  imports: [ReactiveFormsModule],
  templateUrl: './catalogo-tokens.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CatalogoTokensComponent {
  private readonly api = inject(HttpCatalogoAplicacionService);
  private readonly options = inject(PARAMETROS_UI_OPTIONS);
  readonly tokens = signal<CatalogoToken[]>([]);
  readonly estados = signal<CatalogoEstadoToken[]>([]);
  readonly ambientes = signal<Array<{ id: string; nombre: string }>>([]);
  readonly loading = signal(false);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly success = signal('');
  readonly busqueda = signal('');
  readonly crear = signal(false);
  readonly seleccionado = signal<CatalogoToken | null>(null);
  readonly estadoSeleccionado = signal('');
  readonly secreto = signal('');
  readonly credencial = signal<{ id: string; secreto: string; propiedades: string } | null>(null);
  readonly mostrarSecreto = signal(false);
  readonly filtrados = computed(() => {
    const term = this.busqueda().trim().toLocaleLowerCase();
    return this.tokens().filter(token => `${token.id} ${this.ambiente(token.ambienteId)} ${this.estado(token.estadoToken)}`.toLocaleLowerCase().includes(term));
  });
  readonly form = new FormGroup({
    token: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/\S/)] }),
    estadoToken: new FormControl('', { nonNullable: true, validators: Validators.required }),
    ambienteId: new FormControl('', { nonNullable: true, validators: Validators.required }),
    fechaExpiracion: new FormControl('', { nonNullable: true })
  });

  ngOnInit() { this.cargar(); }
  ambiente(id: string) { return this.ambientes().find(item => item.id === id)?.nombre ?? id; }
  estado(id: string) { return this.estados().find(item => item.id === id)?.estado ?? id; }
  fecha(value: string | null | undefined) { return value ? new Date(value).toLocaleString('es-CO') : 'Sin expiración'; }
  abrirCreacion() {
    this.cerrarCredencial(); this.error.set(''); this.success.set('');
    this.form.reset({ token: generarSecretoIntegracion(), estadoToken: this.estados().find(item => item.estado.toLowerCase() === 'activo')?.id ?? '', ambienteId: '', fechaExpiracion: '' });
    this.crear.set(true);
  }
  cerrarCreacion() { if (!this.busy()) { this.crear.set(false); this.form.reset(); } }
  cerrarCredencial() { this.credencial.set(null); this.mostrarSecreto.set(false); }
  abrirDetalle(token: CatalogoToken) { if (!this.busy()) { this.seleccionado.set(token); this.estadoSeleccionado.set(token.estadoToken); this.secreto.set(''); } }
  cerrarDetalle() { if (!this.busy()) { this.seleccionado.set(null); this.secreto.set(''); } }
  generarSecreto() { this.form.controls.token.setValue(generarSecretoIntegracion()); }
  async copiar(value: string) {
    try { await navigator.clipboard.writeText(value); this.success.set('Copiado al portapapeles.'); }
    catch { this.error.set('No fue posible copiar. Seleccione el texto y cópielo manualmente.'); }
  }
  cargar() {
    if (this.loading() || this.busy()) return;
    this.loading.set(true); this.error.set('');
    void firstValueFrom(forkJoin({ tokens: this.api.tokens(), estados: this.api.estadosToken(), ambientes: this.api.ambientes() }))
      .then(data => { this.tokens.set(data.tokens); this.estados.set(data.estados); this.ambientes.set(data.ambientes); })
      .catch(error => this.error.set(this.mensaje(error)))
      .finally(() => this.loading.set(false));
  }
  async guardar() {
    this.form.markAllAsTouched(); if (this.form.invalid || this.busy()) return;
    const value = this.form.getRawValue();
    if (value.fechaExpiracion && new Date(value.fechaExpiracion).getTime() <= Date.now()) { this.error.set('La expiración debe ser posterior a la fecha actual.'); return; }
    this.busy.set(true); this.error.set(''); this.success.set('');
    try {
      const response = await firstValueFrom(this.api.crearToken({ token: value.token.trim(), estadoToken: value.estadoToken, aplicacionId: this.options.applicationId, ambienteId: value.ambienteId, fechaExpiracion: value.fechaExpiracion ? fechaConZona(value.fechaExpiracion) : null }));
      const creado = response.tokens?.[0];
      if (creado) this.credencial.set({ id: creado.id, secreto: value.token.trim(), propiedades: propiedadesIntegracion(this.options.apiBaseUrl, creado.id, this.options.applicationId) });
      this.crear.set(false); this.form.reset(); this.success.set(response.mensajes?.[0] ?? 'Token creado.'); this.notificar('created', creado?.id); this.cargar();
    } catch (error: unknown) { this.error.set(this.mensaje(error)); }
    finally { this.busy.set(false); }
  }
  async cambiarEstado() {
    const token = this.seleccionado(); const estado = this.estadoSeleccionado();
    if (!token || !estado || estado === token.estadoToken || this.busy()) return;
    this.busy.set(true); this.error.set('');
    try { const response = await firstValueFrom(this.api.actualizarEstadoToken(token.id, estado)); this.seleccionado.set(response.tokens?.[0] ?? { ...token, estadoToken: estado }); this.success.set(response.mensajes?.[0] ?? 'Estado actualizado.'); this.notificar('updated', token.id); this.cargar(); }
    catch (error: unknown) { this.error.set(this.mensaje(error)); }
    finally { this.busy.set(false); }
  }
  async validar() {
    const token = this.seleccionado(); const secreto = this.secreto().trim();
    if (!token || !secreto || this.busy()) return;
    this.secreto.set(''); this.busy.set(true); this.error.set(''); this.success.set('');
    try { const valido = await firstValueFrom(this.api.validarToken(token.id, secreto)); if (valido) this.success.set('El token es válido.'); else this.error.set('El token no es válido.'); }
    catch (error: unknown) { this.error.set(this.mensaje(error)); }
    finally { this.busy.set(false); }
  }
  private notificar(operation: 'created' | 'updated', id?: string) {
    try { this.options.onChange?.({ applicationId: this.options.applicationId, resource: 'tokens', operation, id }); }
    catch { /* El callback del host no revierte la operación confirmada. */ }
  }
  private mensaje(error: unknown) { return error instanceof Error ? error.message : 'No fue posible completar la operación.'; }
}
