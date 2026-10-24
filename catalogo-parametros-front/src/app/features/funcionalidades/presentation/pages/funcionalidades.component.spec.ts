import { fechaParaFormulario } from '../../../../shared/utils/date.utils';
import { FormBuilder } from '@angular/forms';
import { of, Subject, throwError } from 'rxjs';
import { EventStreamService } from '../../../../core/realtime/event-stream.service';
import { ModulosRepository } from '../../../modulos/domain/modulos.repository';
import { FuncionalidadesRepository } from '../../domain/funcionalidades.repository';
import { FuncionalidadesComponent } from './funcionalidades.component';

describe('FuncionalidadesComponent', () => {
  let component: FuncionalidadesComponent; let repository: jasmine.SpyObj<FuncionalidadesRepository>; let modules: jasmine.SpyObj<ModulosRepository>; let events: Subject<unknown>;
  beforeEach(() => {
    repository = jasmine.createSpyObj('features', ['findPage', 'findAll', 'create', 'update', 'delete', 'changeStatus'], { eventsUrl: '/events' }); modules = jasmine.createSpyObj('modules', ['findAll']);
    events = new Subject(); const stream = jasmine.createSpyObj<EventStreamService>('events', ['connect']); stream.connect.and.returnValue(events); repository.findPage.and.returnValue(of([])); modules.findAll.and.returnValue(of([{ id: 'm1', nombre: 'Ventas', idAplicacion: 'a1', activo: true }]));
    component = new FuncionalidadesComponent(repository, modules, new FormBuilder(), stream);
  });
  it('carga, filtra y resuelve módulos', () => {
    repository.findPage.and.returnValue(of([{ id: 'f1', nombre: 'Crear', idModulo: 'm1', activo: true }])); component.ngOnInit(); component.searchTerm = 'crear'; expect(component.filteredFuncionalidades.length).toBe(1); expect(component.getModuloNombre('m1')).toBe('Ventas'); expect(component.getModuloNombre('x')).toBe('N/A');
  });
  it('valida y persiste funcionalidades', () => {
    component.saveFuncionalidad(); expect(component.errorMessage).toContain('requeridos');
    const value = { nombre: 'Crear', idModulo: 'm1', activo: true, fechaInicio: '2026-01-01', fechaFinal: '2026-12-31' }; repository.create.and.returnValue(of({ mensajes: ['creada'] })); component.funcionalidadForm.setValue(value); component.saveFuncionalidad(); expect(repository.create).toHaveBeenCalled();
    repository.update.and.returnValue(of({ mensajes: ['editada'] })); component.editFuncionalidad({ id: 'f1', ...value }); component.saveFuncionalidad(); expect(repository.update).toHaveBeenCalled();
  });
  it('sincroniza eventos, cambia estado y elimina', () => {
    component.connectSse(); const item = { id: 'f1', nombre: 'Crear', idModulo: 'm1', activo: true }; events.next({ event: 'CREATED', funcionalidad: item }); events.next({ event: 'UPDATED', funcionalidad: { ...item, nombre: 'Editar' } }); expect(component.funcionalidades[0].nombre).toBe('Editar');
    repository.changeStatus.and.returnValue(of({ mensajes: ['ok'] })); component.changeStatus(component.funcionalidades[0]); expect(component.funcionalidades[0].activo).toBeFalse();
    spyOn(window, 'confirm').and.returnValue(true); repository.delete.and.returnValue(of({ mensajes: ['eliminada'] })); component.deleteFuncionalidad('f1'); expect(component.successMessage).toBe('eliminada'); events.next({ event: 'DELETED', funcionalidad: item });
  });
  it('maneja errores del repositorio', () => {
    repository.findPage.and.returnValue(throwError(() => new Error('carga'))); component.loadFuncionalidades(); expect(component.errorMessage).toBe('carga');
    repository.changeStatus.and.returnValue(throwError(() => new Error('estado'))); component.changeStatus({ id: 'f1', nombre: 'X', idModulo: 'm1', activo: true }); expect(component.errorMessage).toBe('estado');
  });
  it('cubre modal, paginación, SSE vacío y cancelación', () => {
    component.funcionalidades = [{ id: 'f1', nombre: 'F', idModulo: 'm1', activo: true }]; expect(component.filteredFuncionalidades).toBe(component.funcionalidades);
    component.loading = true; component.changePage(2); expect(component.page).toBe(1); component.openModal(); expect(component.showModal).toBeTrue();
    const close = spyOn(component, 'closeModal'); const node = {}; component.closeModalOnOverlay({ target: node, currentTarget: node } as Event); expect(close).toHaveBeenCalled();
    component.connectSse(); events.next({ event: 'CREATED' }); events.next({ event: 'CREATED', funcionalidad: component.funcionalidades[0] });
    spyOn(window, 'confirm').and.returnValue(false); component.deleteFuncionalidad('f1'); expect(repository.delete).not.toHaveBeenCalled();
  });
  it('cubre errores predeterminados de catálogos, guardado y eliminación', () => {
    spyOn(console, 'error'); modules.findAll.and.returnValue(throwError(() => ({}))); component.loadModulos(); expect(console.error).toHaveBeenCalled();
    repository.create.and.returnValue(throwError(() => ({}))); component.funcionalidadForm.setValue({ nombre: 'F', idModulo: 'm1', activo: true, fechaInicio: '2026-01-01', fechaFinal: '2026-02-01' }); component.saveFuncionalidad(); expect(component.errorMessage).toContain('crear');
    spyOn(window, 'confirm').and.returnValue(true); repository.delete.and.returnValue(throwError(() => ({}))); component.deleteFuncionalidad('f1'); expect(component.errorMessage).toContain('eliminar');
  });

  it('usa mensajes predeterminados cuando el servidor no devuelve mensajes de éxito', () => {
    const value = { nombre: 'Crear', idModulo: 'm1', activo: true, fechaInicio: '2026-01-01', fechaFinal: '2026-12-31' };
    repository.create.and.returnValue(of({ mensajes: [] }));
    component.funcionalidadForm.setValue(value);
    component.saveFuncionalidad();
    expect(component.successMessage).toBe('Funcionalidad creada exitosamente');
    expect(component.saving).toBeFalse();
    expect(component.showModal).toBeFalse();

    repository.update.and.returnValue(of({ mensajes: [] }));
    component.editFuncionalidad({ id: 'f1', ...value });
    component.saveFuncionalidad();
    expect(component.successMessage).toBe('Funcionalidad actualizada exitosamente');

    spyOn(window, 'confirm').and.returnValue(true);
    repository.delete.and.returnValue(of({ mensajes: [] }));
    component.deleteFuncionalidad('f1');
    expect(component.successMessage).toBe('Funcionalidad eliminada exitosamente');
  });

  it('activa y desactiva solo la funcionalidad seleccionada sin mensajes del servidor', () => {
    const item = { id: 'f1', nombre: 'Crear', idModulo: 'm1', activo: false };
    const other = { ...item, id: 'f2' };
    component.funcionalidades = [item, other];
    repository.changeStatus.and.returnValue(of({ mensajes: [] }));
    component.changeStatus(item);
    expect(repository.changeStatus).toHaveBeenCalledWith('f1', true);
    expect(component.funcionalidades[0].activo).toBeTrue();
    expect(component.funcionalidades[1]).toBe(other);
    expect(component.successMessage).toBe('Funcionalidad activada exitosamente');
    component.changeStatus(component.funcionalidades[0]);
    expect(repository.changeStatus).toHaveBeenCalledWith('f1', false);
    expect(component.funcionalidades[0].activo).toBeFalse();
    expect(component.successMessage).toBe('Funcionalidad desactivada exitosamente');
  });

  for (const message of ['Error del servidor', '']) {
    it(`conserva la edición tras un fallo al actualizar con mensaje "${message}"`, () => {
      component.editFuncionalidad({ id: 'f1', nombre: 'Crear', idModulo: 'm1', activo: true, fechaInicio: '2026-01-01', fechaFinal: '2026-12-31' });
      repository.update.and.returnValue(throwError(() => new Error(message)));
      component.saveFuncionalidad();
      expect(component.errorMessage).toBe(message || 'Error al actualizar la funcionalidad');
      expect(component.saving).toBeFalse();
      expect(component.showModal).toBeTrue();
      expect(component.editingId).toBe('f1');
    });
  }

  it('conserva el instante y la precisi?n al editar solo el nombre desde otra zona', () => {
    const fechaInicio = '2026-11-01T01:30:25.123456-05:00';
    const fechaFinal = '2026-12-31T23:59:59+05:30';
    repository.update.and.returnValue(of({ mensajes: ['ok'] }));
    component.editFuncionalidad({ id: '1', nombre: 'Original', idModulo: 'm1', activo: true, fechaInicio, fechaFinal });
    expect(component.funcionalidadForm.value.fechaInicio).toBe(fechaParaFormulario(fechaInicio));
    component.funcionalidadForm.patchValue({ nombre: 'Nuevo' });
    component.saveFuncionalidad();
    expect(repository.update).toHaveBeenCalledWith('1', jasmine.objectContaining({ nombre: 'Nuevo', fechaInicio: '2026-11-01T06:30:25.123456Z', fechaFinal: '2026-12-31T18:29:59.000Z' }));
  });

  it('env?a la hora elegida en UTC y rechaza fechas inv?lidas', () => {
    repository.create.and.returnValue(of({ mensajes: ['ok'] }));
    component.funcionalidadForm.patchValue({ nombre: 'Nueva', idModulo: 'm1', activo: true, fechaInicio: '2026-07-15T14:35:42', fechaFinal: '2026-12-31T18:20:00' });
    component.saveFuncionalidad();
    const enviado = repository.create.calls.mostRecent().args[0] as { fechaInicio: string };
    expect(enviado.fechaInicio).toBe(new Date('2026-07-15T14:35:42').toISOString());
    repository.create.calls.reset();
    component.funcionalidadForm.patchValue({ nombre: 'Nueva', idModulo: 'm1', activo: true, fechaInicio: '2026-02-30T14:00:00', fechaFinal: '2026-12-31T18:20:00' });
    component.saveFuncionalidad();
    expect(repository.create).not.toHaveBeenCalled();
  });
});
