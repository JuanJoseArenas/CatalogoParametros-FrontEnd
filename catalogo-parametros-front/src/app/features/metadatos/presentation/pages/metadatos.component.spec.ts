import { FormBuilder } from '@angular/forms';
import { of, Subject, throwError } from 'rxjs';
import { EventStreamService } from '../../../../core/realtime/event-stream.service';
import { ParametrosRepository } from '../../../parametros/domain/parametros.repository';
import { MetadatosRepository } from '../../domain/metadatos.repository';
import { MetadatosComponent } from './metadatos.component';
import { AmbientesRepository } from '../../../ambientes/domain/ambientes.repository';

describe('MetadatosComponent', () => {
  let component: MetadatosComponent; let repository: jasmine.SpyObj<MetadatosRepository>; let parameters: jasmine.SpyObj<ParametrosRepository>; let events: Subject<unknown>;
  const types = [{ id: 'text', tipo: 'text', detalle: 'Texto' }, { id: 'json', tipo: 'json', detalle: 'JSON' }, { id: 'date', tipo: 'date', detalle: 'Fecha' }];
  beforeEach(() => {
    repository = jasmine.createSpyObj('metadata', ['findAll', 'findTypes', 'create', 'update', 'delete'], { eventsUrl: '/events' }); parameters = jasmine.createSpyObj('parameters', ['findAll']);
    events = new Subject(); const stream = jasmine.createSpyObj<EventStreamService>('events', ['connect']); stream.connect.and.returnValue(events);
    const ambientes = jasmine.createSpyObj<AmbientesRepository>('ambientes', ['findPage']); ambientes.findPage.and.returnValue(of([]));
    repository.findAll.and.returnValue(of([])); repository.findTypes.and.returnValue(of(types)); parameters.findAll.and.returnValue(of([{ id: 'p1', nombre: 'Color', idFuncionalidad: 'f1', idTipoParametro: 't1', activo: true }])); component = new MetadatosComponent(repository, parameters, stream, new FormBuilder(), ambientes);
  });
  afterEach(() => component.ngOnDestroy());
  it('sincroniza ambientes y parametros auxiliares por eventos sin recargar el formulario', () => {
    component.connectSse();
    const ambiente = { id: 'dev', nombre: 'Desarrollo' }; const otro = { id: 'prod', nombre: 'Produccion' };
    events.next({ event: 'CREATED', ambiente }); events.next({ event: 'CREATED', ambiente }); events.next({ event: 'CREATED', ambiente: otro });
    expect(component.ambientes.length).toBe(2);
    events.next({ event: 'UPDATED', ambiente: { ...ambiente, nombre: 'Desarrollo nuevo' } });
    expect(component.getAmbienteNombre('dev')).toBe('Desarrollo nuevo');
    events.next({ event: 'DELETED', ambiente }); expect(component.ambientes).toEqual([otro]);
    expect(component.getAmbienteNombre(null)).toContain('Sin ambiente');
    const parametro = { id: 'p1', nombre: 'Color', idFuncionalidad: 'f1', idTipoParametro: 't1', activo: true };
    const segundo = { ...parametro, id: 'p2' };
    events.next({ event: 'CREATED', parametro }); events.next({ event: 'CREATED', parametro }); events.next({ event: 'CREATED', parametro: segundo });
    expect(component.parametros.length).toBe(2);
    events.next({ event: 'UPDATED', parametro: { ...parametro, nombre: 'Color nuevo' } }); expect(component.getParametroNombre('p1')).toBe('Color nuevo');
    events.next({ event: 'DELETED', parametro }); expect(component.parametros).toEqual([segundo]);
  });
  it('impide guardar cuando falta el ambiente del valor', () => {
    component.metadatoForm.patchValue({ idParametro: 'p1', idTipoMetadato: 'text', valor: 'dato' });
    component.saveMetadato(); expect(repository.create).not.toHaveBeenCalled();
    expect(component.metadatoForm.controls['idAmbiente'].invalid).toBeTrue();
  });
  it('inicializa catálogos, nombres, formato y filtro', () => {
    repository.findAll.and.returnValue(of([{ id: 'm1', idParametro: 'p1', idTipoMetadato: 'json', idAmbiente: 'ambiente', valor: { requerido: true } }])); component.ngOnInit(); component.searchTerm = 'requerido';
    expect(component.filteredMetadatos.length).toBe(1); expect(component.getParametroNombre('p1')).toBe('Color'); expect(component.getTipoNombre('json')).toBe('json'); expect(component.formatValor('texto')).toBe('texto');
  });
  it('crea valores de texto y actualiza metadatos', () => {
    repository.create.and.returnValue(of({ mensajes: ['creado'] })); repository.findAll.and.returnValue(of([])); component.tiposMetadato = types;
    component.metadatoForm.setValue({ idParametro: 'p1', idTipoMetadato: 'text', idAmbiente: 'ambiente', valor: ' valor ' }); component.saveMetadato(); expect(repository.create).toHaveBeenCalledWith({ idParametro: 'p1', idTipoMetadato: 'text', idAmbiente: 'ambiente', valor: 'valor' });
    repository.update.and.returnValue(of({ mensajes: ['editado'] })); component.editMetadato({ id: 'm1', idParametro: 'p1', idTipoMetadato: 'json', idAmbiente: 'ambiente', valor: { x: 1 } }); component.saveMetadato(); expect(repository.update).toHaveBeenCalledWith('m1', jasmine.objectContaining({ valor: { x: 1 } }));
  });
  it('rechaza JSON y fechas inválidas', () => {
    component.tiposMetadato = types; component.metadatoForm.setValue({ idParametro: 'p1', idTipoMetadato: 'json', idAmbiente: 'ambiente', valor: 'no-json' }); component.saveMetadato(); expect(component.errorMessage).toContain('JSON válido');
    component.metadatoForm.setValue({ idParametro: 'p1', idTipoMetadato: 'json', idAmbiente: 'ambiente', valor: '123' }); component.saveMetadato(); expect(component.errorMessage).toContain('objeto o arreglo');
    component.metadatoForm.setValue({ idParametro: 'p1', idTipoMetadato: 'date', idAmbiente: 'ambiente', valor: '2026-02-30' }); component.saveMetadato(); expect(component.errorMessage).toContain('fecha válida');
  });
  it('sincroniza eventos y elimina', () => {
    component.connectSse(); const item = { id: 'm1', idParametro: 'p1', idTipoMetadato: 'text', idAmbiente: 'ambiente', valor: 'a' }; events.next({ event: 'CREATED', metadato: item }); events.next({ event: 'UPDATED', metadato: { ...item, valor: 'b' } }); expect(component.metadatos[0].valor).toBe('b'); events.next({ event: 'DELETED', metadato: item }); expect(component.metadatos).toEqual([]);
    spyOn(window, 'confirm').and.returnValue(true); repository.delete.and.returnValue(of({ mensajes: ['eliminado'] })); repository.findAll.and.returnValue(of([])); component.deleteMetadato('m1'); expect(component.successMessage).toBe('eliminado');
  });
  it('maneja errores de carga y guardado', () => {
    repository.findAll.and.returnValue(throwError(() => new Error('carga'))); component.loadMetadatos(); expect(component.errorMessage).toBe('carga');
    component.tiposMetadato = types; repository.create.and.returnValue(throwError(() => new Error('guardar'))); component.metadatoForm.setValue({ idParametro: 'p1', idTipoMetadato: 'text', idAmbiente: 'ambiente', valor: 'x' }); component.saveMetadato(); expect(component.errorMessage).toBe('guardar');
  });
  it('cubre formulario inválido, cambio de tipo, modal y valores ausentes', () => {
    component.saveMetadato(); expect(component.errorMessage).toContain('requeridos');
    component.errorMessage = 'x'; component.onTipoChange(); expect(component.errorMessage).toBe('');
    component.openModal(); expect(component.showModal).toBeTrue(); expect(component.selectedTipo).toBe('');
    expect(component.getParametroNombre('x')).toBe('N/A'); expect(component.getTipoNombre('x')).toBe('N/A');
    const close = spyOn(component, 'closeModal'); const node = {}; component.closeModalOnOverlay({ target: node, currentTarget: {} } as Event); expect(close).not.toHaveBeenCalled(); component.closeModalOnOverlay({ target: node, currentTarget: node } as Event);
  });
  it('acepta JSON arreglo y una fecha real', () => {
    component.tiposMetadato = types; repository.create.and.returnValue(of({ mensajes: [] })); repository.findAll.and.returnValue(of([]));
    component.metadatoForm.setValue({ idParametro: 'p1', idTipoMetadato: 'json', idAmbiente: 'ambiente', valor: '[1,2]' }); component.saveMetadato(); expect(repository.create).toHaveBeenCalledWith(jasmine.objectContaining({ valor: [1, 2] }));
    component.metadatoForm.setValue({ idParametro: 'p1', idTipoMetadato: 'date', idAmbiente: 'ambiente', valor: '2026-02-28' }); component.saveMetadato(); expect(repository.create).toHaveBeenCalledWith(jasmine.objectContaining({ valor: '2026-02-28' }));
  });
  it('cubre eventos vacíos, duplicados, error SSE y cancelación', () => {
    const item = { id: 'm1', idParametro: 'p1', idTipoMetadato: 'text', idAmbiente: 'ambiente', valor: 'a' }; component.metadatos = [item]; component.connectSse(); events.next({ event: 'CREATED' }); events.next({ event: 'CREATED', metadato: item }); expect(component.metadatos.length).toBe(1); events.error(new Error()); expect(component.isConnected).toBeFalse();
    spyOn(window, 'confirm').and.returnValue(false); component.deleteMetadato('m1'); expect(repository.delete).not.toHaveBeenCalled();
  });
  it('cubre errores predeterminados de inicialización y eliminación', () => {
    parameters.findAll.and.returnValue(throwError(() => ({}))); component.ngOnInit(); expect(component.errorMessage).toContain('formulario');
    spyOn(window, 'confirm').and.returnValue(true); repository.delete.and.returnValue(throwError(() => ({}))); component.deleteMetadato('m1'); expect(component.errorMessage).toContain('eliminar');
  });
});
