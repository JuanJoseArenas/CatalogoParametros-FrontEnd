import { ChangeDetectionStrategy, Component, DestroyRef, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { PARAMETROS_UI_OPTIONS } from '../../../../microfrontend/config';
import type { ParametrosUiChange, ParametrosUiResource } from '../../../../microfrontend/types';
import { disponibleParaUso } from '../../../shared/utils/disponibilidad';
import { fechaConZona, fechaLocalValida, fechaParaFormulario } from '../../../shared/utils/date.utils';
import type { CatalogoAplicacion, RegistroEditable, SolicitudCatalogo } from '../domain/catalogo-aplicacion';
import { CambioCatalogo, HttpCatalogoAplicacionService } from '../infrastructure/http-catalogo-aplicacion.service';

@Component({
  selector: 'uco-catalogo-embebido',
  imports: [ReactiveFormsModule],
  templateUrl: './catalogo-embebido.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CatalogoEmbebidoComponent implements OnInit, OnDestroy {
  private readonly api = inject(HttpCatalogoAplicacionService);
  private readonly options = inject(PARAMETROS_UI_OPTIONS);
  private readonly destroyRef = inject(DestroyRef);
  readonly datos = signal<CatalogoAplicacion | null>(null);
  readonly recurso = signal<ParametrosUiResource>('modulos');
  readonly loading = signal(false);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly success = signal('');
  readonly editor = signal(false);
  readonly editingId = signal<string | undefined>(undefined);
  readonly borrarId = signal<string | null>(null);
  readonly busqueda = signal('');
  readonly conectado = signal(false);
  readonly cambiosPendientes = signal(false);
  readonly tabs: ReadonlyArray<{ id: ParametrosUiResource; label: string }> = [
    { id: 'modulos', label: 'Módulos' }, { id: 'funcionalidades', label: 'Funcionalidades' },
    { id: 'parametros', label: 'Parámetros' }, { id: 'metadatos', label: 'Metadatos' },
    { id: 'metadatos-ambiente', label: 'Por ambiente' }
  ];
  readonly form = new FormGroup({
    nombre: new FormControl('', { nonNullable: true }),
    idPadre: new FormControl('', { nonNullable: true }),
    idTipo: new FormControl('', { nonNullable: true }),
    idAmbiente: new FormControl('', { nonNullable: true }),
    idEstado: new FormControl('', { nonNullable: true }),
    activo: new FormControl(true, { nonNullable: true }),
    fechaInicio: new FormControl('', { nonNullable: true }),
    fechaFinal: new FormControl('', { nonNullable: true }),
    valor: new FormControl('', { nonNullable: true })
  });
  readonly tieneEstado = computed(() => ['modulos', 'funcionalidades', 'parametros'].includes(this.recurso()));
  readonly tieneFechas = computed(() => ['modulos', 'funcionalidades'].includes(this.recurso()));
  readonly appDisponible = computed(() => !!this.datos() && disponibleParaUso(this.datos()!.aplicacion));
  readonly titulo = computed(() => this.tabs.find(t => t.id === this.recurso())!.label);
  readonly registros = computed<RegistroEditable[]>(() => {
    const data = this.datos(); if (!data) return [];
    const lista: RegistroEditable[] = this.recurso() === 'metadatos-ambiente' ? data.metadatosAmbiente : data[this.recurso() as 'modulos' | 'funcionalidades' | 'parametros' | 'metadatos'];
    const buscar = this.busqueda().trim().toLocaleLowerCase();
    return lista.filter(item => !buscar || `${this.nombre(item)} ${item.id}`.toLocaleLowerCase().includes(buscar));
  });
  initialLoad: Promise<void> = Promise.resolve();
  private pending: Promise<void> = Promise.resolve();
  private interval?: ReturnType<typeof setInterval>;
  private destroyed = false;
  private debounceEvento?: ReturnType<typeof setTimeout>;
  private estuvoConectado = false;
  private revisionEventos = 0;
  private cambioRemoto?: CambioCatalogo;
  private fechasOriginales: { inicio?: string; fin?: string } = {};

  ngOnInit() {
    this.api.escuchar().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(evento => {
      if (evento.recurso === 'conexion') {
        this.conectado.set(evento.operacion === 'CONNECTED');
        if (this.conectado()) { if (this.estuvoConectado) this.programarActualizacion(); this.estuvoConectado = true; }
      } else this.programarActualizacion(evento);
    });
    this.initialLoad = this.refresh();
    void this.initialLoad.catch(() => undefined);
    const interval = this.options.refreshIntervalMs ?? 60000;
    if (interval) this.interval = setInterval(() => {
      if (!document.hidden && !this.editor() && !this.busy()) void this.refresh().catch(() => undefined);
    }, interval);
  }
  ngOnDestroy() { this.destroyed = true; if (this.interval) clearInterval(this.interval); if (this.debounceEvento) clearTimeout(this.debounceEvento); }
  private programarActualizacion(evento?: CambioCatalogo) {
    if (evento) { this.cambioRemoto = evento; this.revisionEventos++; }
    this.cambiosPendientes.set(true);
    if (this.debounceEvento) clearTimeout(this.debounceEvento);
    this.debounceEvento = setTimeout(() => {
      if (!this.destroyed && !this.editor() && !this.busy() && !this.loading()) void this.refresh().catch(() => undefined);
    }, 250);
  }
  refresh(): Promise<void> {
    if (this.destroyed) return Promise.resolve();
    if (this.loading()) return this.pending;
    const revision = this.revisionEventos;
    let completada = false;
    this.loading.set(true); this.error.set('');
    this.pending = firstValueFrom(this.api.consultar().pipe(takeUntilDestroyed(this.destroyRef)))
      .then(data => {
        if (this.destroyed) return;
        completada = true;
        const distinto = this.datos() !== null && JSON.stringify(this.datos()) !== JSON.stringify(data);
        this.datos.set(data); this.cambiosPendientes.set(this.revisionEventos !== revision);
        const evento = this.cambioRemoto;
        if (distinto && evento && ['modulos', 'funcionalidades', 'parametros', 'metadatos', 'metadatos-ambiente', 'aplicaciones', 'ambientes'].includes(evento.recurso)) {
          const operation = evento.operacion === 'CREATED' ? 'created' : evento.operacion === 'DELETED' ? 'deleted' : 'updated';
          this.notificar(evento.recurso as ParametrosUiChange['resource'], operation, evento.id);
        }
        if (!this.cambiosPendientes()) this.cambioRemoto = undefined;
      })
      .catch((error: unknown) => { if (!this.destroyed) { this.error.set(this.mensaje(error)); throw error; } })
      .finally(() => { if (!this.destroyed) { this.loading.set(false); if (completada && this.cambiosPendientes()) this.programarActualizacion(); } });
    return this.pending;
  }
  actualizar() { void this.refresh().catch(() => undefined); }
  elegir(resource: ParametrosUiResource) { if (!this.busy()) { this.recurso.set(resource); this.cerrar(); this.busqueda.set(''); this.borrarId.set(null); } }
  nombre(item: RegistroEditable): string {
    const data = this.datos();
    if (item.nombre) return item.nombre;
    const parametro = data?.parametros.find(p => p.id === item.idParametro)?.nombre ?? item.idParametro ?? item.id;
    const detalle = this.recurso() === 'metadatos' ? data?.tiposMetadato.find(t => t.id === item.idTipoMetadato)?.tipo
      : data?.ambientes.find(a => a.id === item.idAmbiente)?.nombre;
    const ambiente = data?.ambientes.find(a => a.id === item.idAmbiente)?.nombre ?? 'Sin ambiente';
    return `${parametro} · ${detalle ?? ''}${this.recurso() === 'metadatos' ? ' · ' + ambiente : ''}`;
  }
  estado(item: RegistroEditable) {
    if (this.recurso() === 'metadatos') return 'Sin estado propio';
    if (this.recurso() === 'metadatos-ambiente') return this.datos()?.estadosMetadatoAmbiente.find(e => e.id === item.idEstadoMetadatoAmbiente)?.nombre ?? 'Sin estado';
    return item.activo ? 'Activo' : 'Inactivo';
  }
  resumen(item: RegistroEditable) { const valor = JSON.stringify(item.valor); return valor ? valor.slice(0, 160) : ''; }
  padres(): Array<{ id: string; nombre: string; disabled: boolean }> {
    const data = this.datos(); if (!data) return [];
    const tipo = this.recurso();
    const lista = tipo === 'funcionalidades' ? data.modulos : tipo === 'parametros' ? data.funcionalidades : data.parametros;
    const moduloValido = (id: string) => { const m = data.modulos.find(m => m.id === id); return !!m && disponibleParaUso(m); };
    const funcionValida = (id: string) => { const f = data.funcionalidades.find(f => f.id === id); return !!f && disponibleParaUso(f) && moduloValido(f.idModulo); };
    return lista.map(item => ({ id: item.id, nombre: item.nombre, disabled: !disponibleParaUso(data.aplicacion) || !disponibleParaUso(item)
      || (tipo === 'parametros' && !moduloValido((item as { idModulo: string }).idModulo))
      || (['metadatos', 'metadatos-ambiente'].includes(tipo) && !funcionValida((item as { idFuncionalidad: string }).idFuncionalidad)) }));
  }
  abrir(item?: RegistroEditable) {
    if (this.busy()) return;
    this.error.set(''); this.success.set(''); this.editingId.set(item?.id); this.fechasOriginales = { inicio: item?.fechaInicio, fin: item?.fechaFinal };
    for (const control of Object.values(this.form.controls)) { control.clearValidators(); control.reset(); }
    this.form.patchValue({
      nombre: item?.nombre ?? '', idPadre: item?.idModulo ?? item?.idFuncionalidad ?? item?.idParametro ?? '',
      idTipo: item?.idTipoParametro ?? item?.idTipoMetadato ?? '', idAmbiente: item?.idAmbiente ?? '',
      idEstado: item?.idEstadoMetadatoAmbiente ?? '', activo: item?.activo ?? true,
      fechaInicio: fechaParaFormulario(item?.fechaInicio), fechaFinal: fechaParaFormulario(item?.fechaFinal),
      valor: item?.valor === undefined ? '' : JSON.stringify(item.valor, null, 2)
    });
    if (this.tieneEstado()) this.form.controls.nombre.setValidators(Validators.required);
    if (this.recurso() !== 'modulos') this.form.controls.idPadre.setValidators(Validators.required);
    if (['parametros', 'metadatos'].includes(this.recurso())) this.form.controls.idTipo.setValidators(Validators.required);
    if (this.tieneFechas()) { this.form.controls.fechaInicio.setValidators(Validators.required); this.form.controls.fechaFinal.setValidators(Validators.required); }
    if (this.recurso() === 'metadatos') { this.form.controls.valor.setValidators(Validators.required); this.form.controls.idAmbiente.setValidators(Validators.required); }
    if (this.recurso() === 'metadatos-ambiente') { this.form.controls.idAmbiente.setValidators(Validators.required); this.form.controls.idEstado.setValidators(Validators.required); }
    for (const control of Object.values(this.form.controls)) control.updateValueAndValidity();
    this.editor.set(true);
  }
  cerrar() { if (!this.busy()) { this.editor.set(false); this.form.reset(); this.editingId.set(undefined); if (this.cambiosPendientes()) this.programarActualizacion(); } }
  async guardar() {
    this.form.markAllAsTouched(); if (this.form.invalid || this.busy()) return;
    const v = this.form.getRawValue(); const tipo = this.recurso(); const id = this.editingId();
    const data: SolicitudCatalogo = {};
    try {
      if (this.tieneEstado()) { data.nombre = v.nombre.trim(); data.activo = v.activo; }
      if (tipo === 'funcionalidades') data.idModulo = v.idPadre;
      if (tipo === 'parametros') { data.idFuncionalidad = v.idPadre; data.idTipoParametro = v.idTipo; }
      if (tipo === 'metadatos') { data.idParametro = v.idPadre; data.idTipoMetadato = v.idTipo; data.idAmbiente = v.idAmbiente; data.valor = JSON.parse(v.valor) as unknown; }
      if (tipo === 'metadatos-ambiente') { data.idParametro = v.idPadre; data.idAmbiente = v.idAmbiente; data.idEstadoMetadatoAmbiente = v.idEstado; }
      if (this.tieneFechas()) {
        if (!fechaLocalValida(v.fechaInicio) || !fechaLocalValida(v.fechaFinal)) throw new Error('Las fechas no son válidas.');
        data.fechaInicio = fechaConZona(v.fechaInicio, this.fechasOriginales.inicio);
        data.fechaFinal = fechaConZona(v.fechaFinal, this.fechasOriginales.fin);
        if (Date.parse(data.fechaFinal) < Date.parse(data.fechaInicio)) throw new Error('La fecha final no puede ser anterior a la inicial.');
      }
    } catch (error: unknown) { this.error.set(tipo === 'metadatos' ? 'Ingrese un valor JSON válido, por ejemplo "texto", 25, true o un objeto.' : this.mensaje(error)); return; }
    this.busy.set(true); this.error.set('');
    try {
      const response = await firstValueFrom(this.api.guardar(tipo, data, id).pipe(takeUntilDestroyed(this.destroyRef)));
      if (this.destroyed) return;
      this.editor.set(false); this.form.reset(); this.editingId.set(undefined);
      this.success.set(response.mensajes?.[0] ?? 'Cambios guardados.');
      this.notificar(tipo, id ? 'updated' : 'created', id);
      await this.refresh();
    } catch (error: unknown) { if (!this.destroyed) this.error.set(this.mensaje(error)); }
    finally { if (!this.destroyed) this.busy.set(false); }
  }
  async eliminar() {
    const id = this.borrarId(); if (!id || this.busy()) return;
    const tipo = this.recurso(); this.busy.set(true); this.error.set('');
    try {
      const response = await firstValueFrom(this.api.eliminar(tipo, id).pipe(takeUntilDestroyed(this.destroyRef)));
      if (this.destroyed) return;
      this.borrarId.set(null); this.success.set(response.mensajes?.[0] ?? 'Registro eliminado.');
      this.notificar(tipo, 'deleted', id); await this.refresh();
    } catch (error: unknown) { if (!this.destroyed) this.error.set(this.mensaje(error)); }
    finally { if (!this.destroyed) this.busy.set(false); }
  }
  private notificar(resource: ParametrosUiChange['resource'], operation: 'created' | 'updated' | 'deleted', id?: string) {
    try { this.options.onChange?.({ applicationId: this.options.applicationId, resource, operation, id }); }
    catch { /* La mutacion ya fue confirmada; un callback del host no la revierte. */ }
  }
  private mensaje(error: unknown) { return error instanceof Error ? error.message : 'No fue posible completar la operación.'; }
}
