import { ApplicationRef, ComponentRef, createComponent, provideZonelessChangeDetection } from '@angular/core';
import { createApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { CatalogoEmbebidoComponent } from '../app/features/catalogo-embebido/presentation/catalogo-embebido.component';
import { normalizarOpciones, PARAMETROS_UI_OPTIONS } from './config';
import type { ParametrosUiHandle, ParametrosUiOptions } from './types';
import css from './styles.css';
export type { ParametrosUiHandle, ParametrosUiOptions, ParametrosUiChange, ParametrosUiTheme } from './types';
export const PARAMETROS_UI_VERSION = '1.0.0';
const montajes = new WeakMap<HTMLElement, ParametrosUiHandle>();

/** ESM sin router propio ni dependencia del framework del consumidor. */
export function mount(container: HTMLElement, options: ParametrosUiOptions): ParametrosUiHandle {
  if (!(container instanceof HTMLElement)) throw new TypeError('El contenedor debe ser un HTMLElement.');
  const config = normalizarOpciones(options);
  montajes.get(container)?.unmount();
  const element = document.createElement('uco-parametros-administration');
  const shadow = element.attachShadow({ mode: 'open' });
  const style = document.createElement('style'); style.textContent = css;
  const point = document.createElement('div');
  const status = document.createElement('p'); status.setAttribute('role', 'status'); status.textContent = 'Cargando administración de parámetros…';
  point.append(status); shadow.append(style, point);
  if (config.theme?.accent) element.style.setProperty('--catalogo-accent', config.theme.accent);
  if (config.theme?.fontFamily) element.style.setProperty('--catalogo-font', config.theme.fontFamily);
  if (config.theme?.radius) element.style.setProperty('--catalogo-radius', config.theme.radius);
  container.replaceChildren(element);
  let disposed = false;
  let app: ApplicationRef | undefined;
  let component: ComponentRef<CatalogoEmbebidoComponent> | undefined;
  const ready = createApplication({ providers: [
    provideZonelessChangeDetection(), provideHttpClient(), { provide: PARAMETROS_UI_OPTIONS, useValue: config }
  ] }).then(async application => {
    if (disposed) { application.destroy(); return; }
    app = application; point.replaceChildren();
    component = createComponent(CatalogoEmbebidoComponent, { hostElement: point, environmentInjector: app.injector });
    app.attachView(component.hostView); component.changeDetectorRef.detectChanges();
    await component.instance.initialLoad;
  }).catch((error: unknown) => {
    if (!disposed && !component) { status.setAttribute('role', 'alert'); status.textContent = 'No fue posible iniciar la administración de parámetros.'; point.replaceChildren(status); }
    throw error;
  });
  // El componente presenta sus errores; el host puede esperar ready sin un rechazo global no manejado.
  void ready.catch(() => undefined);
  const handle: ParametrosUiHandle = {
    element, ready,
    refresh: async () => { await ready.catch(() => undefined); if (!disposed && component) await component.instance.refresh(); },
    unmount: () => {
      if (disposed) return;
      disposed = true;
      app?.destroy(); component = undefined; app = undefined; element.remove();
      if (montajes.get(container) === handle) montajes.delete(container);
    }
  };
  montajes.set(container, handle);
  return handle;
}
