import { AfterViewInit, Component, ElementRef, InjectionToken, OnDestroy, ViewChild, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import type { ParametrosUiHandle, ParametrosUiOptions } from '../../../../microfrontend/types';
import { environment } from '../../../../environments/environment';
import { SECURITY_CONFIG } from '../../../core/security/security-config';
import { redirectToLogin } from '../../../core/security/session';

export interface ParametrosUiModule { mount(container: HTMLElement, options: ParametrosUiOptions): ParametrosUiHandle; }
export async function cargarParametrosUi(): Promise<ParametrosUiModule> {
  const url = new URL('parametros-ui/parametros-administration.js', document.baseURI).href;
  return import(/* webpackIgnore: true */ /* @vite-ignore */ url);
}
export const PARAMETROS_UI_LOADER = new InjectionToken<typeof cargarParametrosUi>('ParametrosUiLoader', {
  providedIn: 'root', factory: () => cargarParametrosUi
});

@Component({
  selector: 'app-catalogo-embebido-host',
  template: `
    @if (loading()) { <p role="status">Cargando administración de parámetros…</p> }
    @if (error()) { <p role="alert">{{ error() }}</p><button type="button" class="btn btn-secondary" (click)="montar()">Reintentar</button> }
    <div #container></div>
  `
})
export class CatalogoEmbebidoHostComponent implements AfterViewInit, OnDestroy {
  @ViewChild('container', { static: true }) container!: ElementRef<HTMLElement>;
  private readonly route = inject(ActivatedRoute);
  private readonly load = inject(PARAMETROS_UI_LOADER);
  private readonly security = inject(SECURITY_CONFIG);
  readonly loading = signal(true);
  readonly error = signal('');
  private handle?: ParametrosUiHandle;
  private subscription?: Subscription;
  private applicationId = '';
  private generation = 0;
  ngAfterViewInit() {
    this.subscription = this.route.paramMap.subscribe(params => {
      this.applicationId = params.get('id') ?? ''; void this.montar();
    });
  }
  async montar() {
    const generation = ++this.generation; this.loading.set(true); this.error.set('');
    this.handle?.unmount(); this.handle = undefined;
    try {
      const remote = await this.load();
      if (generation !== this.generation) return;
      this.handle = remote.mount(this.container.nativeElement, {
        applicationId: this.applicationId,
        apiBaseUrl: new URL(environment.apiUrl, document.baseURI).href,
        onAuthenticationRequired: () => redirectToLogin(this.security)
      });
      await this.handle.ready;
    } catch {
      if (generation === this.generation) this.error.set('No fue posible cargar la administración. Compruebe la sesión y los permisos de esta aplicación.');
    } finally { if (generation === this.generation) this.loading.set(false); }
  }
  ngOnDestroy() { this.generation++; this.subscription?.unsubscribe(); this.handle?.unmount(); }
}
