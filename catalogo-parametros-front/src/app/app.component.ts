import { Component, ChangeDetectionStrategy, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './layout/components/sidebar/sidebar.component';
import { EventStreamService } from './core/realtime/event-stream.service';
import { Subscription } from 'rxjs';

interface AvisoEnTiempoReal {
  eventType: string;
  messageCode: string;
  environmentId: string;
  eventId: string;
}

@Component({
    selector: 'app-root',
    imports: [RouterOutlet, SidebarComponent],
    changeDetection: ChangeDetectionStrategy.Eager,
    template: `
    <div class="app-container">
      <app-sidebar></app-sidebar>
      <div class="main-shell">
        <header class="topbar">
          <div>
            <div class="topbar-label">Universidad Católica de Oriente</div>
            <div class="topbar-context">Plataforma institucional de servicios digitales</div>
          </div>
          <div class="topbar-status">Servicios operativos</div>
        </header>
        <div class="avisos-estado" [class.conectado]="avisoConectado()">
          {{ avisoConectado() ? '● Avisos en vivo conectados' : '● Avisos en vivo desconectados' }}
        </div>
        @if (ultimoAviso(); as aviso) {
          <div class="avisos-tiempo-real" role="status">
            Aviso recibido: {{ aviso.eventType }} · {{ aviso.messageCode }}
          </div>
        }
        <main class="main-content">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `
})
export class AppComponent implements OnInit, OnDestroy {
  private readonly eventStream = inject(EventStreamService);
  private avisoSubscription?: Subscription;
  readonly avisoConectado = signal(false);
  readonly ultimoAviso = signal<AvisoEnTiempoReal | null>(null);

  ngOnInit(): void {
    this.avisoSubscription = this.eventStream.connect<AvisoEnTiempoReal>(
      '/catalogo-parametros/api/v1/avisos',
      'aviso',
      conectado => this.avisoConectado.set(conectado)
    ).subscribe({
      next: aviso => this.ultimoAviso.set(aviso),
      error: () => this.avisoConectado.set(false)
    });
  }

  ngOnDestroy(): void {
    this.avisoSubscription?.unsubscribe();
  }
  title = 'Catálogo de Parámetros UCO';
}
