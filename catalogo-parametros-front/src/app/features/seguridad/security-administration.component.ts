import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, InjectionToken, inject, signal } from '@angular/core';
import { SECURITY_CONFIG, SecurityConfig } from '../../core/security/security-config';
import { requireSession } from '../../core/security/session';

export interface SecurityUiHandle { unmount(): void; }
export interface SecurityUiModule {
  mount(container: Element, options: {
    applicationName: string; applicationId?: string; apiBaseUrl: string;
    allowApplicationLifecycleManagement: boolean;
    theme: { accent: string; fontFamily: string; radius: string };
  }): SecurityUiHandle;
}

// El navegador resuelve el módulo ESM remoto, sin acoplar Angular al runtime de Vue.
export async function loadSecurityUi(config: SecurityConfig): Promise<SecurityUiModule> {
  const url = new URL(config.securityUiUrl, document.baseURI).href;
  return import(/* webpackIgnore: true */ /* @vite-ignore */ url);
}

export const SECURITY_UI_LOADER = new InjectionToken<typeof loadSecurityUi>('SecurityUiLoader', {
  providedIn: 'root', factory: () => loadSecurityUi
});

@Component({
  selector: 'app-security-administration',
  template: `
    <section>
      <h1>Administración de seguridad</h1>
      @if (loading()) { <p role="status">Cargando administración de seguridad…</p> }
      @if (error()) {
        <p role="alert">{{ error() }}</p>
        <button type="button" (click)="mount()">Reintentar</button>
      }
      <div #container></div>
    </section>
  `
})
export class SecurityAdministrationComponent implements AfterViewInit, OnDestroy {
  @ViewChild('container', { static: true }) container!: ElementRef<HTMLElement>;
  readonly loading = signal(true);
  readonly error = signal('');
  private readonly config = inject(SECURITY_CONFIG);
  private readonly loadRemote = inject(SECURITY_UI_LOADER);
  private handle?: SecurityUiHandle;
  private destroyed = false;

  ngAfterViewInit(): void { void this.mount(); }

  async mount(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      if (!await requireSession(this.config) || this.destroyed) return;
      const remote = await this.loadRemote(this.config);
      if (this.destroyed) return;
      this.handle?.unmount();
      this.handle = remote.mount(this.container.nativeElement, {
        applicationName: this.config.applicationName,
        ...(this.config.applicationId ? { applicationId: this.config.applicationId } : {}),
        apiBaseUrl: this.config.pdpUrl,
        allowApplicationLifecycleManagement: false,
        theme: { accent: '#116149', fontFamily: 'Inter, sans-serif', radius: '12px' }
      });
    } catch {
      if (!this.destroyed) this.error.set('No fue posible cargar la administración de seguridad. Comprueba la conexión e intenta nuevamente.');
    } finally {
      if (!this.destroyed) this.loading.set(false);
    }
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.handle?.unmount();
  }
}
