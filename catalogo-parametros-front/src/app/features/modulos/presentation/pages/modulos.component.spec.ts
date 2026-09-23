import { fechaParaFormulario } from '../../../../shared/utils/date.utils';
import { FormBuilder } from '@angular/forms';
import { of, Subject, throwError } from 'rxjs';
import { EventStreamService } from '../../../../core/realtime/event-stream.service';
import { AplicacionesRepository } from '../../../aplicaciones/domain/aplicaciones.repository';
import { ModulosRepository } from '../../domain/modulos.repository';
import { ModulosComponent } from './modulos.component';

describe('ModulosComponent', () => {
  let component: ModulosComponent; let repository: jasmine.SpyObj<ModulosRepository>; let applications: jasmine.SpyObj<AplicacionesRepository>; let events: Subject<unknown>;
  beforeEach(() => {
    repository = jasmine.createSpyObj('modules', ['findPage', 'findAll', 'create', 'update', 'delete', 'changeStatus'], { eventsUrl: '/events' });
    applications = jasmine.createSpyObj('apps', ['findAll']); events = new Subject(); const stream = jasmine.createSpyObj<EventStreamService>('events', ['connect']); stream.connect.and.returnValue(events);
    repository.findPage.and.returnValue(of([])); applications.findAll.and.returnValue(of([{ id: 'a1', nombre: 'App', idOrganizacion: 'o1', activa: true }])); component = new ModulosComponent(repository, applications, new FormBuilder(), stream);
  });
  it('inicializa catálogos, filtros y nombres', () => {
    repository.findPage.and.returnValue(of([{ id: 'm1', nombre: 'Ventas', idAplicacion: 'a1', activo: true }])); component.ngOnInit(); component.searchTerm = 'venta';
    expect(component.filteredModulos.length).toBe(1); expect(component.getAplicacionNombre('a1')).toBe('App'); expect(component.getAplicacionNombre('x')).toBe('N/A');
  });
  it('crea y edita módulos', () => {
    repository.create.and.returnValue(of({ mensajes: ['creado'] })); component.moduloForm.setValue({ nombre: 'Ventas', idAplicacion: 'a1', activo: true, fechaInicio: '', fechaFinal: '' }); component.saveModulo(); expect(repository.create).toHaveBeenCalled();
    repository.findPage.and.returnValue(of([])); repository.update.and.returnValue(of({ mensajes: ['editado'] })); component.editModulo({ id: 'm1', nombre: 'Ventas', idAplicacion: 'a1', activo: true }); component.saveModulo(); expect(repository.update).toHaveBeenCalled();
  });
  it('sincroniza SSE, estado y eliminación', () => {
    component.connectSse(); const item = { id: 'm1', nombre: 'Ventas', idAplicacion: 'a1', activo: true }; events.next({ event: 'CREATED', modulo: item }); events.next({ event: 'UPDATED', modulo: { ...item, nombre: 'Compras' } }); expect(component.modulos[0].nombre).toBe('Compras');
    repository.changeStatus.and.returnValue(of({ mensajes: [] })); component.changeStatus(component.modulos[0]); expect(component.modulos[0].activo).toBeFalse();
    spyOn(window, 'confirm').and.returnValue(true); repository.delete.and.returnValue(of({ mensajes: ['eliminado'] })); repository.findPage.and.returnValue(of([])); component.deleteModulo('m1'); expect(repository.delete).toHaveBeenCalled();
    events.next({ event: 'DELETED', modulo: item }); expect(component.modulos).toEqual([]);
  });
  it('informa errores de carga y guardado', () => {
    repository.findPage.and.returnValue(throwError(() => new Error('carga'))); component.loadModulos(); expect(component.errorMessage).toBe('carga');
    repository.create.and.returnValue(throwError(() => new Error('guardar'))); component.moduloForm.setValue({ nombre: 'X', idAplicacion: 'a1', activo: true, fechaInicio: '', fechaFinal: '' }); component.saveModulo(); expect(component.errorMessage).toBe('guardar');
  });
  it('cubre ramas de modal, paginación y eventos vacíos', () => {
    component.modulos = [{ id: 'm1', nombre: 'M', idAplicacion: 'a1', activo: true }]; expect(component.filteredModulos).toBe(component.modulos);
    component.loading = true; component.changePage(2); expect(component.page).toBe(1); component.openModal(); expect(component.showModal).toBeTrue();
    const close = spyOn(component, 'closeModal'); const node = {}; component.closeModalOnOverlay({ target: node, currentTarget: {} } as Event); expect(close).not.toHaveBeenCalled(); component.closeModalOnOverlay({ target: node, currentTarget: node } as Event);
    component.connectSse(); events.next({ event: 'CREATED' }); events.next({ event: 'CREATED', modulo: component.modulos[0] });
  });
  it('cubre errores y mensajes predeterminados', () => {
    spyOn(console, 'error'); applications.findAll.and.returnValue(throwError(() => new Error())); component.loadAplicaciones(); expect(console.error).toHaveBeenCalled();
    repository.changeStatus.and.returnValue(throwError(() => ({}))); component.changeStatus({ id: 'm1', nombre: 'M', idAplicacion: 'a1', activo: true }); expect(component.errorMessage).toContain('estado');
    spyOn(window, 'confirm').and.returnValue(true); repository.delete.and.returnValue(throwError(() => ({}))); component.deleteModulo('m1'); expect(component.errorMessage).toContain('eliminar');
  });
  it('cubre formulario inválido, fechas y mensajes alternativos', () => {
    component.saveModulo(); expect(component.errorMessage).toContain('requeridos');
    repository.create.and.returnValue(of({ mensajes: [] })); repository.findPage.and.returnValue(of([])); component.moduloForm.setValue({ nombre: 'M', idAplicacion: 'a1', activo: true, fechaInicio: '2026-01-01', fechaFinal: '2026-12-31' }); component.saveModulo(); expect(component.successMessage).toContain('creado');
    repository.update.and.returnValue(of({ mensajes: [] })); component.editModulo({ id: 'm1', nombre: 'M', idAplicacion: 'a1', activo: false, fechaInicio: undefined, fechaFinal: undefined }); component.saveModulo(); expect(component.successMessage).toContain('actualizado');
    repository.changeStatus.and.returnValue(of({ mensajes: [] })); component.modulos = [{ id: 'm1', nombre: 'M', idAplicacion: 'a1', activo: false }]; component.changeStatus(component.modulos[0]); expect(component.successMessage).toContain('activado');
  });

  it('conserva el instante y la precisi?n al editar solo el nombre desde otra zona', () => {
    const fechaInicio = '2026-11-01T01:30:25.123456-05:00';
    const fechaFinal = '2026-12-31T23:59:59+05:30';
    repository.update.and.returnValue(of({ mensajes: ['ok'] }));
    component.editModulo({ id: '1', nombre: 'Original', idAplicacion: 'a1', activo: true, fechaInicio, fechaFinal });
    expect(component.moduloForm.value.fechaInicio).toBe(fechaParaFormulario(fechaInicio));
    component.moduloForm.patchValue({ nombre: 'Nuevo' });
    component.saveModulo();
    expect(repository.update).toHaveBeenCalledWith('1', jasmine.objectContaining({ nombre: 'Nuevo', fechaInicio, fechaFinal }));
  });

  it('env?a la hora elegida con desfase local y rechaza fechas inv?lidas', () => {
    repository.create.and.returnValue(of({ mensajes: ['ok'] }));
    component.moduloForm.patchValue({ nombre: 'Nueva', idAplicacion: 'a1', activo: true, fechaInicio: '2026-07-15T14:35:42', fechaFinal: '2026-12-31T18:20:00' });
    component.saveModulo();
    const enviado = repository.create.calls.mostRecent().args[0] as { fechaInicio: string };
    expect(enviado.fechaInicio).toMatch(/^2026-07-15T14:35:42[+-]\d{2}:\d{2}$/);
    repository.create.calls.reset();
    component.moduloForm.patchValue({ nombre: 'Nueva', idAplicacion: 'a1', activo: true, fechaInicio: '2026-02-30T14:00:00', fechaFinal: '2026-12-31T18:20:00' });
    component.saveModulo();
    expect(repository.create).not.toHaveBeenCalled();
  });
});
