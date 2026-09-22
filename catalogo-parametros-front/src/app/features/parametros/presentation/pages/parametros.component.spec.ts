import { FormBuilder } from '@angular/forms';
import { of, Subject, throwError } from 'rxjs';
import { EventStreamService } from '../../../../core/realtime/event-stream.service';
import { FuncionalidadesRepository } from '../../../funcionalidades/domain/funcionalidades.repository';
import { ParametrosRepository } from '../../domain/parametros.repository';
import { ParametrosComponent } from './parametros.component';

describe('ParametrosComponent', () => {
  let component: ParametrosComponent; let repository: jasmine.SpyObj<ParametrosRepository>; let features: jasmine.SpyObj<FuncionalidadesRepository>; let events: Subject<unknown>;
  beforeEach(() => {
    repository = jasmine.createSpyObj('parameters', ['findPage', 'findAll', 'findTypes', 'create', 'update', 'delete', 'changeStatus'], { eventsUrl: '/events' }); features = jasmine.createSpyObj('features', ['findAll']);
    events = new Subject(); const stream = jasmine.createSpyObj<EventStreamService>('events', ['connect']); stream.connect.and.returnValue(events);
    repository.findPage.and.returnValue(of([])); repository.findTypes.and.returnValue(of([{ id: 't1', nombre: 'Texto' }])); features.findAll.and.returnValue(of([{ id: 'f1', nombre: 'Crear', idModulo: 'm1', activo: true }])); component = new ParametrosComponent(repository, features, new FormBuilder(), stream);
  });
  it('inicializa, filtra y resuelve nombres relacionados', () => {
    repository.findPage.and.returnValue(of([{ id: 'p1', nombre: 'Color', idFuncionalidad: 'f1', idTipoParametro: 't1', activo: true }])); component.ngOnInit(); component.searchTerm = 'color';
    expect(component.filteredParametros.length).toBe(1); expect(component.getFuncionalidadNombre('f1')).toBe('Crear'); expect(component.getTipoParametroNombre('t1')).toBe('Texto'); expect(component.getFuncionalidadNombre('x')).toBe('N/A');
  });
  it('valida, crea y actualiza parámetros', () => {
    component.saveParametro(); expect(component.errorMessage).toBe('Todos los campos son requeridos');
    const value = { nombre: 'Color', idFuncionalidad: 'f1', idTipoParametro: 't1', activo: true }; repository.create.and.returnValue(of({ mensajes: ['creado'] })); component.parametroForm.setValue(value); component.saveParametro(); expect(repository.create).toHaveBeenCalledWith(value);
    repository.update.and.returnValue(of({ mensajes: ['editado'] })); component.editParametro({ id: 'p1', ...value }); component.saveParametro(); expect(repository.update).toHaveBeenCalledWith('p1', value);
  });
  it('procesa SSE, cambios de estado y eliminación', () => {
    component.connectSse(); const item = { id: 'p1', nombre: 'Color', idFuncionalidad: 'f1', idTipoParametro: 't1', activo: true }; events.next({ event: 'CREATED', parametro: item }); events.next({ event: 'UPDATED', parametro: { ...item, nombre: 'Tono' } }); expect(component.parametros[0].nombre).toBe('Tono');
    repository.changeStatus.and.returnValue(of({ mensajes: ['estado'] })); component.changeStatus(component.parametros[0]); expect(component.parametros[0].activo).toBeFalse();
    spyOn(window, 'confirm').and.returnValue(true); repository.delete.and.returnValue(of({ mensajes: ['eliminado'] })); component.deleteParametro('p1'); expect(component.successMessage).toBe('eliminado'); events.next({ event: 'DELETED', parametro: item });
  });
  it('maneja fallos de carga y catálogos', () => {
    repository.findPage.and.returnValue(throwError(() => new Error('carga'))); component.loadParametros(); expect(component.errorMessage).toBe('carga');
    spyOn(console, 'error'); repository.findTypes.and.returnValue(throwError(() => new Error('tipos'))); component.loadTiposParametro(); expect(console.error).toHaveBeenCalled();
  });
  it('cubre modal, paginación, nombres ausentes y SSE vacío', () => {
    component.parametros = [{ id: 'p1', nombre: 'P', idFuncionalidad: 'f1', idTipoParametro: 't1', activo: true }]; expect(component.filteredParametros).toBe(component.parametros); expect(component.getTipoParametroNombre('x')).toBe('N/A');
    component.loading = true; component.changePage(2); expect(component.page).toBe(1); component.openModal(); expect(component.showModal).toBeTrue();
    const close = spyOn(component, 'closeModal'); const node = {}; component.closeModalOnOverlay({ target: node, currentTarget: node } as Event); expect(close).toHaveBeenCalled(); component.connectSse(); events.next({ event: 'CREATED' }); events.next({ event: 'CREATED', parametro: component.parametros[0] });
  });
  it('cubre errores predeterminados de catálogos, guardado, estado y eliminación', () => {
    spyOn(console, 'error'); features.findAll.and.returnValue(throwError(() => ({}))); component.loadFuncionalidades(); expect(console.error).toHaveBeenCalled();
    const value = { nombre: 'P', idFuncionalidad: 'f1', idTipoParametro: 't1', activo: true }; repository.create.and.returnValue(throwError(() => ({}))); component.parametroForm.setValue(value); component.saveParametro(); expect(component.errorMessage).toContain('crear');
    repository.changeStatus.and.returnValue(throwError(() => ({}))); component.changeStatus({ id: 'p1', ...value }); expect(component.errorMessage).toContain('estado');
    spyOn(window, 'confirm').and.returnValue(true); repository.delete.and.returnValue(throwError(() => ({}))); component.deleteParametro('p1'); expect(component.errorMessage).toContain('eliminar');
  });
  it('cubre mensajes alternativos de actualización y estado activo', () => {
    const value = { nombre: 'P', idFuncionalidad: 'f1', idTipoParametro: 't1', activo: false };
    repository.update.and.returnValue(of({ mensajes: [] })); component.editParametro({ id: 'p1', ...value }); component.saveParametro(); expect(component.successMessage).toContain('actualizado');
    repository.changeStatus.and.returnValue(of({ mensajes: [] })); component.parametros = [{ id: 'p1', ...value }]; component.changeStatus(component.parametros[0]); expect(component.successMessage).toContain('activado');
    spyOn(window, 'confirm').and.returnValue(false); component.deleteParametro('p1'); expect(repository.delete).not.toHaveBeenCalled();
  });
});
