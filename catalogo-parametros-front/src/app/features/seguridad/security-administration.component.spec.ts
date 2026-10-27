import { TestBed } from '@angular/core/testing';
import { SECURITY_CONFIG } from '../../core/security/security-config';
import { SECURITY_UI_LOADER, SecurityAdministrationComponent } from './security-administration.component';

describe('Administración de seguridad del host', () => {
  const config = { pdpUrl: 'http://localhost:18080', securityUiUrl: 'http://localhost:5175/security-administration.js', applicationName: 'Catalogo' };
  let mount: jasmine.Spy;
  let unmount: jasmine.Spy;
  let loader: jasmine.Spy;
  beforeEach(() => {
    unmount = jasmine.createSpy('unmount');
    mount = jasmine.createSpy('mount').and.returnValue({ unmount });
    loader = jasmine.createSpy('loader').and.resolveTo({ mount });
    spyOn(window, 'fetch').and.resolveTo(new Response('{}', { status: 200 }));
    TestBed.configureTestingModule({ imports: [SecurityAdministrationComponent], providers: [
      { provide: SECURITY_CONFIG, useValue: config },
      { provide: SECURITY_UI_LOADER, useValue: loader }
    ] });
  });

  it('monta únicamente el contrato público y libera la instancia al salir', async () => {
    const fixture = TestBed.createComponent(SecurityAdministrationComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(mount).toHaveBeenCalledOnceWith(jasmine.any(HTMLElement), {
      applicationName: config.applicationName, apiBaseUrl: config.pdpUrl,
      allowApplicationLifecycleManagement: false,
      theme: { accent: '#116149', fontFamily: 'Inter, sans-serif', radius: '12px' }
    });
    fixture.destroy();
    expect(unmount).toHaveBeenCalledTimes(1);
  });

  it('presenta un error recuperable cuando el bundle no está disponible', async () => {
    loader.and.rejectWith(new Error('network'));
    const fixture = TestBed.createComponent(SecurityAdministrationComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
    expect(mount).not.toHaveBeenCalled();
    loader.and.resolveTo({ mount });
    await fixture.componentInstance.mount();
    expect(mount).toHaveBeenCalledTimes(1);
  });

  it('no monta un bundle que termina de cargar después de salir de la página', async () => {
    let resolve!: (remote: { mount: jasmine.Spy }) => void;
    loader.and.returnValue(new Promise(result => resolve = result));
    const fixture = TestBed.createComponent(SecurityAdministrationComponent);
    const pending = fixture.componentInstance.mount();
    await Promise.resolve();
    fixture.destroy();
    resolve({ mount });
    await pending;
    expect(mount).not.toHaveBeenCalled();
  });
});
