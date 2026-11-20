import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { CatalogoTokenDetalle } from '../domain/token-administration';
import { HttpCatalogoAplicacionService } from '../infrastructure/http-catalogo-aplicacion.service';
import type { CatalogoToken } from '../domain/token-administration';

@Component({
  selector: 'uco-catalogo-consulta',
  imports: [ReactiveFormsModule],
  templateUrl: './catalogo-consulta.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CatalogoConsultaComponent {
  private readonly api = inject(HttpCatalogoAplicacionService);
  readonly tokens = signal<CatalogoToken[]>([]);
  readonly resultado = signal<{ aplicacion: { nombre: string } | null; ambiente: { nombre: string } | null; parametros: CatalogoTokenDetalle[] } | null>(null);
  readonly loading = signal(false);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly form = new FormGroup({ tokenId: new FormControl('', { nonNullable: true, validators: Validators.required }), secreto: new FormControl('', { nonNullable: true, validators: Validators.required }) });

  ngOnInit() { this.cargar(); }
  cargar() {
    if (this.loading() || this.busy()) return;
    this.loading.set(true); this.error.set('');
    void firstValueFrom(this.api.tokens()).then(tokens => { this.tokens.set(tokens); if (!tokens.some(token => token.id === this.form.controls.tokenId.value)) this.form.controls.tokenId.setValue(''); })
      .catch(error => this.error.set(this.mensaje(error))).finally(() => this.loading.set(false));
  }
  limpiar() { this.resultado.set(null); this.form.controls.secreto.reset(); this.error.set(''); }
  async consultar() {
    this.form.markAllAsTouched(); if (this.form.invalid || this.busy()) return;
    const { tokenId, secreto } = this.form.getRawValue(); this.busy.set(true); this.error.set(''); this.resultado.set(null); this.form.controls.secreto.reset();
    try { const response = await firstValueFrom(this.api.consultarParametrosPorToken(tokenId, secreto)); this.resultado.set({ aplicacion: response.aplicacion, ambiente: response.ambiente, parametros: response.parametros }); }
    catch (error: unknown) { this.error.set(this.mensaje(error)); }
    finally { this.busy.set(false); }
  }
  valor(value: unknown) { return typeof value === 'string' ? value : JSON.stringify(value, null, 2); }
  private mensaje(error: unknown) { return error instanceof Error ? error.message : 'No fue posible completar la consulta.'; }
}
