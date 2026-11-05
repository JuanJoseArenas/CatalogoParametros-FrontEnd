import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnDestroy, ViewChild, inject, signal } from '@angular/core';
import { mount } from 'minifront-mensajes';
import { environment } from '../../../environments/environment';
import { SECURITY_CONFIG, SecurityConfig } from '../../core/security/security-config';
import { redirectToLogin, requireSession } from '../../core/security/session';

interface MessageUcoLabWidget {
  unmount(): void;
}

@Component({
  selector: 'app-messageucolab-admin',
  template: `
    <section class="message-page">
      <h1>Administración de mensajes</h1>
      @if (loading()) { <p role="status">Cargando administración de mensajes…</p> }
      @if (error()) {
        <p role="alert">{{ error() }}</p>
        <button type="button" class="btn btn-secondary" (click)="montar()">Reintentar</button>
      }
      <div #container></div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    .message-page { min-height: calc(100vh - 48px); }
    .message-page h1 { margin: 0 0 16px; }
  `]
})
export class MessageUcoLabAdminComponent implements AfterViewInit, OnDestroy {
  @ViewChild('container', { static: true }) container!: ElementRef<HTMLElement>;
  readonly loading = signal(true);
  readonly error = signal('');
  private readonly security = inject<SecurityConfig>(SECURITY_CONFIG);
  private widget?: MessageUcoLabWidget;
  private destroyed = false;

  ngAfterViewInit(): void { void this.montar(); }

  async montar(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      if (!await requireSession(this.security) || this.destroyed) return;
      this.widget?.unmount();
      this.widget = mount(this.container.nativeElement, {
        apiBaseUrl: environment.messageucolab.apiBaseUrl,
        applicationName: environment.messageucolab.applicationName,
        environmentName: environment.messageucolab.environmentName,
        loginUrl: environment.messageucolab.loginUrl,
        lockContext: true,
        allowApplicationCreation: false,
        onUnauthorized: () => redirectToLogin(this.security)
      });
    } catch {
      if (!this.destroyed) this.error.set('No fue posible cargar la administración de MessageUcoLab.');
    } finally {
      if (!this.destroyed) this.loading.set(false);
    }
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.widget?.unmount();
  }
}
