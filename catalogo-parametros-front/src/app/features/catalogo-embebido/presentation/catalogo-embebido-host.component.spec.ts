import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { CatalogoEmbebidoHostComponent, PARAMETROS_UI_LOADER } from './catalogo-embebido-host.component';
import { SECURITY_CONFIG } from '../../../core/security/security-config';
import { APP_ID } from '../testing/catalogo.fixture';

describe('Host del microfrontend', () => {
  const params = new BehaviorSubject(convertToParamMap({ id: APP_ID }));
  let load: jasmine.Spy; let mount: jasmine.Spy; let unmount: jasmine.Spy;
  beforeEach(() => {
    unmount = jasmine.createSpy();
    mount = jasmine.createSpy().and.returnValue({ ready: Promise.resolve(), unmount });
    load = jasmine.createSpy().and.resolveTo({ mount });
    TestBed.configureTestingModule({ imports: [CatalogoEmbebidoHostComponent], providers: [
      { provide: ActivatedRoute, useValue: { paramMap: params } },
      { provide: PARAMETROS_UI_LOADER, useValue: load },
      { provide: SECURITY_CONFIG, useValue: {} }
    ] });
  });
  it('monta con el ID del catalogo y desmonta al salir', async () => {
    const fixture = TestBed.createComponent(CatalogoEmbebidoHostComponent);
    fixture.detectChanges(); await fixture.whenStable();
    expect(mount.calls.mostRecent().args[1].applicationId).toBe(APP_ID);
    expect(fixture.componentInstance.loading()).toBeFalse();
    fixture.destroy(); expect(unmount).toHaveBeenCalled();
  });
  it('permite reintentar cuando falla la descarga del modulo', async () => {
    load.and.rejectWith(new Error('network'));
    const fixture = TestBed.createComponent(CatalogoEmbebidoHostComponent);
    fixture.detectChanges(); await fixture.whenStable();
    expect(fixture.componentInstance.error()).toContain('No fue posible');
    load.and.resolveTo({ mount }); await fixture.componentInstance.montar();
    expect(fixture.componentInstance.error()).toBe(''); fixture.destroy();
  });
  it('ignora la descarga pendiente si el host ya fue destruido', async () => {
    let resolve!: (value: { mount: jasmine.Spy }) => void;
    load.and.returnValue(new Promise(r => resolve = r));
    const fixture = TestBed.createComponent(CatalogoEmbebidoHostComponent);
    fixture.detectChanges(); fixture.destroy(); resolve({ mount });
    await Promise.resolve(); expect(mount).not.toHaveBeenCalled();
  });
});
