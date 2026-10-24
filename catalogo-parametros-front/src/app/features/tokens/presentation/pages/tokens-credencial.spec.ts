import { of } from 'rxjs';
import { TokensComponent } from './tokens.component';
import { HttpTokensRepository } from '../../infrastructure/http-tokens.repository';
import { HttpAplicacionesRepository } from '../../../aplicaciones/infrastructure/http-aplicaciones.repository';
import { HttpAmbientesRepository } from '../../../ambientes/infrastructure/http-ambientes.repository';

describe('Entrega de credenciales de integracion', () => {
  let component: TokensComponent;
  let repository: jasmine.SpyObj<HttpTokensRepository>;
  beforeEach(() => {
    repository = jasmine.createSpyObj('tokens', ['create', 'validate', 'changeState', 'findById']);
    component = new TokensComponent(repository, {} as HttpAplicacionesRepository, {} as HttpAmbientesRepository);
    spyOn(component, 'load');
    component.estados = [{ id: 'activo', estado: 'ACTIVO' }];
  });
  afterEach(() => component.ngOnDestroy());
  it('busca por IDs y resuelve nombres auxiliares con fallback', () => {
    component.tokens = [{ id: 'token', aplicacionId: 'app', ambienteId: 'dev', estadoToken: 'activo', fechaCreacion: '', fechaExpiracion: null }];
    component.aplicaciones = [{ id: 'app', nombre: 'Catalogo', idOrganizacion: 'org', activa: true }];
    component.ambientes = [{ id: 'dev', nombre: 'Desarrollo' }];
    component.search = 'catalogo'; expect(component.filteredTokens.length).toBe(1);
    component.search = 'desconocido'; expect(component.filteredTokens.length).toBe(0);
    expect(component.appName('otra')).toBe('otra'); expect(component.environmentName('otro')).toBe('otro');
    expect(component.stateName('otro')).toBe('otro'); expect(component.stateName('activo')).toBe('ACTIVO');
  });
  it('valida sin conservar secretos y diferencia tokens invalidos', () => {
    component.validate(); expect(repository.validate).not.toHaveBeenCalled();
    component.selected = { id: 'token', aplicacionId: 'app', ambienteId: 'dev', estadoToken: 'activo', fechaCreacion: '', fechaExpiracion: null };
    component.secreto = '  privado  '; repository.validate.and.returnValue(of(true)); component.validate();
    expect(component.secreto).toBe(''); expect(component.successMessage).toContain('válido');
    component.secreto = 'privado'; repository.validate.and.returnValue(of(false)); component.validate();
    expect(component.errorMessage).toContain('no es válido'); component.closeDetail(); expect(component.selected).toBeNull();
  });
  it('impide crear con campos incompletos, vencimiento pasado o una operacion pendiente', () => {
    component.create(); expect(repository.create).not.toHaveBeenCalled();
    component.form.patchValue({ token: 'privado', aplicacionId: 'app', ambienteId: 'dev', estadoToken: 'activo', fechaExpiracion: '2000-01-01T00:00:00' });
    component.create(); expect(component.errorMessage).toContain('posterior');
    component.busy = true; component.form.patchValue({ fechaExpiracion: '2099-01-01T00:00:00' });
    component.create(); expect(repository.create).not.toHaveBeenCalled();
    component.changeState(); expect(repository.changeState).not.toHaveBeenCalled();
  });
  it('genera una credencial y entrega el secreto original aunque el servidor solo devuelva el registro', () => {
    component.abrirCreacion();
    const secret = component.form.controls.token.value;
    expect(secret).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(component.form.controls.estadoToken.value).toBe('activo');
    component.form.patchValue({ aplicacionId: 'app', ambienteId: 'dev', fechaExpiracion: '2099-01-01T00:00:00' });
    repository.create.and.returnValue(of({ mensajes: ['Creado'], tokens: [{ id: 'token-id', fechaCreacion: '2026-10-23T00:00:00Z', aplicacionId: 'app', ambienteId: 'dev', estadoToken: 'activo', fechaExpiracion: '2099-01-01T00:00:00Z' }] }));
    component.create();
    expect(component.credencialGenerada?.secreto).toBe(secret);
    expect(component.credencialGenerada?.propiedades).toContain('catalogo.parametros.token-id=token-id');
    expect(component.credencialGenerada?.propiedades).not.toContain(secret);
    expect(component.form.controls.token.value).toBe('');
    component.cerrarCredencial(); expect(component.credencialGenerada).toBeNull();
  });
  it('limpia la credencial anterior al generar otra y al abandonar la pantalla', () => {
    component.credencialGenerada = { id: 'anterior', secreto: 'privado', propiedades: '' };
    component.mostrarSecretoGenerado = true; component.abrirCreacion();
    expect(component.credencialGenerada).toBeNull(); expect(component.mostrarSecretoGenerado).toBeFalse();
    const first = component.form.controls.token.value; component.generarSecreto();
    expect(component.form.controls.token.value).not.toBe(first);
    component.ngOnDestroy(); expect(component.form.controls.token.value).toBe('');
  });
});

