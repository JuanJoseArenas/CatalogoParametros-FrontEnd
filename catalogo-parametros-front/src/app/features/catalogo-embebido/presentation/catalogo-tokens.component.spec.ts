import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { PARAMETROS_UI_OPTIONS } from '../../../../microfrontend/config';
import { HttpCatalogoAplicacionService } from '../infrastructure/http-catalogo-aplicacion.service';
import { CatalogoTokensComponent } from './catalogo-tokens.component';
import { APP_ID } from '../testing/catalogo.fixture';

describe('Tokens del microfrontend', () => {
  let fixture: ComponentFixture<CatalogoTokensComponent>;
  let component: CatalogoTokensComponent;
  let api: jasmine.SpyObj<HttpCatalogoAplicacionService>;
  let change: jasmine.Spy;
  const token = { id: 'token-1', estadoToken: 'activo', aplicacionId: APP_ID, ambienteId: 'dev', fechaCreacion: '2026-01-01T00:00:00Z', fechaExpiracion: null };

  beforeEach(async () => {
    api = jasmine.createSpyObj('catalogo', ['tokens', 'estadosToken', 'ambientes', 'crearToken', 'actualizarEstadoToken', 'validarToken']);
    change = jasmine.createSpy('change');
    api.tokens.and.returnValue(of([token])); api.estadosToken.and.returnValue(of([{ id: 'activo', estado: 'Activo' }, { id: 'revocado', estado: 'Revocado' }]));
    api.ambientes.and.returnValue(of([{ id: 'dev', nombre: 'Desarrollo' }])); api.crearToken.and.returnValue(of({ mensajes: ['Creado'], tokens: [{ ...token, id: 'token-2' }] }));
    api.actualizarEstadoToken.and.returnValue(of({ mensajes: ['Actualizado'], tokens: [{ ...token, estadoToken: 'revocado' }] })); api.validarToken.and.returnValue(of(true));
    await TestBed.configureTestingModule({ imports: [CatalogoTokensComponent], providers: [
      { provide: HttpCatalogoAplicacionService, useValue: api }, { provide: PARAMETROS_UI_OPTIONS, useValue: { applicationId: APP_ID, apiBaseUrl: 'https://catalogo.example/api', onChange: change } }
    ] }).compileComponents();
    fixture = TestBed.createComponent(CatalogoTokensComponent); component = fixture.componentInstance; fixture.detectChanges(); await fixture.whenStable();
  });
  afterEach(() => fixture.destroy());

  it('carga, filtra y presenta los tokens de la aplicación', () => {
    expect(component.tokens()).toEqual([token]); expect(component.ambiente('dev')).toBe('Desarrollo'); expect(component.estado('activo')).toBe('Activo');
    component.busqueda.set('revocado'); expect(component.filtrados()).toEqual([]); component.busqueda.set('token-1'); expect(component.filtrados()).toEqual([token]);
  });
  it('crea un token y deja la credencial disponible solo en memoria', async () => {
    component.abrirCreacion(); component.form.patchValue({ ambienteId: 'dev', estadoToken: 'activo', token: 'secreto-seguro' });
    await component.guardar();
    expect(api.crearToken).toHaveBeenCalledWith(jasmine.objectContaining({ aplicacionId: APP_ID, ambienteId: 'dev', token: 'secreto-seguro' }));
    expect(component.credencial()?.secreto).toBe('secreto-seguro'); expect(component.crear()).toBeFalse(); expect(change).toHaveBeenCalledWith(jasmine.objectContaining({ resource: 'tokens', operation: 'created' }));
  });
  it('actualiza el estado y valida el secreto sin conservarlo', async () => {
    component.abrirDetalle(token); component.estadoSeleccionado.set('revocado'); await component.cambiarEstado();
    expect(api.actualizarEstadoToken).toHaveBeenCalledWith('token-1', 'revocado'); expect(component.seleccionado()?.estadoToken).toBe('revocado'); expect(change).toHaveBeenCalledWith(jasmine.objectContaining({ resource: 'tokens', operation: 'updated' }));
    component.secreto.set('secreto'); await component.validar(); expect(api.validarToken).toHaveBeenCalledWith('token-1', 'secreto'); expect(component.secreto()).toBe('');
  });
  it('muestra errores del servidor y evita crear formularios inválidos', async () => {
    component.abrirCreacion(); component.form.reset(); await component.guardar(); expect(api.crearToken).not.toHaveBeenCalled();
    api.validarToken.and.returnValue(throwError(() => new Error('Token inválido'))); component.abrirDetalle(token); component.secreto.set('x'); await component.validar(); expect(component.error()).toBe('Token inválido');
  });
  it('rechaza expiración pasada y protege acciones concurrentes o redundantes', async () => {
    component.abrirCreacion(); component.form.patchValue({ ambienteId: 'dev', estadoToken: 'activo', token: 'secreto', fechaExpiracion: '2020-01-01T00:00' }); await component.guardar();
    expect(component.error()).toContain('posterior'); expect(api.crearToken).not.toHaveBeenCalled();
    component.loading.set(true); component.cargar(); component.loading.set(false); component.busy.set(true); component.cargar(); component.busy.set(false);
    component.abrirDetalle(token); component.estadoSeleccionado.set(token.estadoToken); await component.cambiarEstado(); component.secreto.set(''); await component.validar(); expect(api.actualizarEstadoToken).not.toHaveBeenCalled();
  });
  it('conserva un mensaje de error al fallar la carga de tokens', async () => {
    api.tokens.and.returnValue(throwError(() => new Error('Sin permisos'))); component.cargar(); await new Promise(resolve => setTimeout(resolve, 0)); expect(component.error()).toBe('Sin permisos');
  });
});
