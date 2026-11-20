import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { PARAMETROS_UI_OPTIONS } from '../../../../microfrontend/config';
import { HttpCatalogoAplicacionService } from '../infrastructure/http-catalogo-aplicacion.service';
import { CatalogoConsultaComponent } from './catalogo-consulta.component';
import { APP_ID } from '../testing/catalogo.fixture';

describe('Consulta por token del microfrontend', () => {
  let fixture: ComponentFixture<CatalogoConsultaComponent>;
  let component: CatalogoConsultaComponent;
  let api: jasmine.SpyObj<HttpCatalogoAplicacionService>;
  beforeEach(async () => {
    api = jasmine.createSpyObj('catalogo', ['tokens', 'consultarParametrosPorToken']);
    api.tokens.and.returnValue(of([{ id: 'token-1', estadoToken: 'activo', aplicacionId: APP_ID, ambienteId: 'dev', fechaCreacion: '2026-01-01T00:00:00Z', fechaExpiracion: null }]));
    api.consultarParametrosPorToken.and.returnValue(of({ aplicacion: { id: APP_ID, nombre: 'Aplicación' }, ambiente: { id: 'dev', nombre: 'Desarrollo' }, parametros: [{ parametro: { id: 'p1', nombre: 'Color', activo: true, valor: 'verde' }, tipoParametro: { tipo: 'Texto' } }] }));
    await TestBed.configureTestingModule({ imports: [CatalogoConsultaComponent], providers: [
      { provide: HttpCatalogoAplicacionService, useValue: api }, { provide: PARAMETROS_UI_OPTIONS, useValue: { applicationId: APP_ID, apiBaseUrl: 'https://catalogo.example/api' } }
    ] }).compileComponents();
    fixture = TestBed.createComponent(CatalogoConsultaComponent); component = fixture.componentInstance; fixture.detectChanges(); await fixture.whenStable();
  });
  afterEach(() => fixture.destroy());

  it('carga tokens y consulta los parámetros autorizados', async () => {
    component.form.setValue({ tokenId: 'token-1', secreto: 'secreto' }); await component.consultar();
    expect(api.consultarParametrosPorToken).toHaveBeenCalledWith('token-1', 'secreto'); expect(component.form.controls.secreto.value).toBe(''); expect(component.resultado()?.parametros[0].parametro.nombre).toBe('Color');
    expect(component.valor({ clave: 'valor' })).toContain('clave'); component.limpiar(); expect(component.resultado()).toBeNull();
  });
  it('valida la entrada y presenta errores de consulta', async () => {
    await component.consultar(); expect(api.consultarParametrosPorToken).not.toHaveBeenCalled();
    api.consultarParametrosPorToken.and.returnValue(throwError(() => new Error('No autorizado'))); component.form.setValue({ tokenId: 'token-1', secreto: 'secreto' }); await component.consultar(); expect(component.error()).toBe('No autorizado');
  });
  it('maneja cargas concurrentes y errores al actualizar los tokens', async () => {
    component.loading.set(true); component.cargar(); component.loading.set(false); component.busy.set(true); component.cargar(); component.busy.set(false);
    api.tokens.and.returnValue(throwError(() => new Error('No hay sesión'))); component.cargar(); await new Promise(resolve => setTimeout(resolve, 0)); expect(component.error()).toBe('No hay sesión');
  });
});
