import { of, throwError } from 'rxjs';
import { ConsultaParametrosComponent } from './consulta-parametros.component';
import { HttpTokensRepository } from '../../infrastructure/http-tokens.repository';
import { HttpAplicacionesRepository } from '../../../aplicaciones/infrastructure/http-aplicaciones.repository';
import { HttpAmbientesRepository } from '../../../ambientes/infrastructure/http-ambientes.repository';
import { ActivatedRoute } from '@angular/router';
describe('ConsultaParametrosComponent', () => {
  let component: ConsultaParametrosComponent;
  let repository: jasmine.SpyObj<HttpTokensRepository>;
  beforeEach(() => {
    repository = jasmine.createSpyObj('tokens', ['findParameters']);
    component = new ConsultaParametrosComponent(repository, {} as HttpAplicacionesRepository, {} as HttpAmbientesRepository, {} as ActivatedRoute);
    component.tokenId = 'token'; component.secreto = 'secret';
  });
  afterEach(() => component.ngOnDestroy());
  it('consulta y conserva el resultado completo, limpiando el secreto', () => {
    const response = { aplicacion:null, ambiente:null, parametros:[], mensajes:[] };
    repository.findParameters.and.returnValue(of(response));
    component.parameters();
    expect(repository.findParameters).toHaveBeenCalledWith('token', 'secret');
    expect(component.parametros).toBe(response); expect(component.secreto).toBe(''); expect(component.busy).toBeFalse();
    component.clearResult(); expect(component.parametros).toBeNull();
  });
  it('limpia resultados previos y muestra el rechazo del backend', () => {
    component.parametros = { aplicacion:null, ambiente:null, parametros:[], mensajes:[] };
    repository.findParameters.and.returnValue(throwError(() => new Error('Token expirado')));
    component.parameters();
    expect(component.parametros).toBeNull(); expect(component.errorMessage).toBe('Token expirado'); expect(component.secreto).toBe(''); expect(component.busy).toBeFalse();
  });
  it('impide consultas sin secreto o mientras carga', () => {
    component.loading = true; component.parameters(); component.loading = false;
    component.secreto = ' '; component.parameters();
    expect(repository.findParameters).not.toHaveBeenCalled();
  });
});
