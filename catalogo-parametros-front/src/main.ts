import { provideZoneChangeDetection } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { loadSecurityConfig, SECURITY_CONFIG } from './app/core/security/security-config';
import { requireSession } from './app/core/security/session';

async function start(): Promise<void> {
  const config = await loadSecurityConfig();
  if (!await requireSession(config)) return;
  await bootstrapApplication(AppComponent, {
    ...appConfig,
    providers: [provideZoneChangeDetection(), ...appConfig.providers, { provide: SECURITY_CONFIG, useValue: config }]
  });
}

void start().catch(() => {
  const root = document.querySelector('app-root');
  if (!root) return;
  const message = document.createElement('p');
  message.setAttribute('role', 'alert');
  message.textContent = 'No fue posible iniciar la aplicación. Comprueba la conexión con el servicio de seguridad.';
  const retry = document.createElement('button');
  retry.textContent = 'Reintentar';
  retry.onclick = () => window.location.reload();
  root.replaceChildren(message, retry);
});
