import { FormBuilder } from '@angular/forms';
import { of, Subject, throwError } from 'rxjs';
import { EventStreamService } from '../../../core/realtime/event-stream.service';
import { OrganizacionesRepository } from '../../organizaciones/domain/organizaciones.repository';
import { AplicacionesRepository } from '../domain/aplicaciones.repository';
import { AplicacionesComponent } from './aplicaciones.component';

describe('AplicacionesComponent', () => {
  let component: AplicacionesComponent; let repository: jasmine.SpyObj<AplicacionesRepository>; let organizations: jasmine.SpyObj<OrganizacionesRepository>; let events: Subject<unknown>;
  beforeEach(() => {
    repository = jasmine.createSpyObj('apps', ['findPage', 'findAll', 'create', 'update', 'delete', 'changeStatus'], { eventsUrl: '/events' });
    organizations = jasmine.createSpyObj('orgs', ['findAll']); events = new Subject();
    const stream = jasmine.createSpyObj<EventStreamService>('events', ['connect']); stream.connect.and.returnValue(events);
    repository.findPage.and.returnValue(of([])); organizations.findAll.and.returnValue(of([{ id: 'o1', nombre: 'UCO' }]));
    component = new AplicacionesComponent(repository, organizations, new FormBuilder(), stream);
  });
  it('carga, filtra y resuelve el nombre de organización', () => {
    repository.findPage.and.returnValue(of([{ id: 'a1', nombre: 'Portal', idOrganizacion: 'o1', activa: true }])); component.ngOnInit();
    component.searchTerm = 'portal'; expect(component.filteredAplicaciones.length).toBe(1); expect(component.getOrganizacionNombre('o1')).toBe('UCO'); expect(component.getOrganizacionNombre('x')).toBe('N/A');
  });
  it('crea y actualiza desde el formulario', () => {
    repository.create.and.returnValue(of({ mensajes: ['creada'] })); component.aplicacionForm.setValue({ nombre: 'App', idOrganizacion: 'o1', activa: true, fechaInicio: '', fechaFinal: '' }); component.saveAplicacion(); expect(repository.create).toHaveBeenCalled();
    repository.update.and.returnValue(of({ mensajes: ['actualizada'] })); component.editAplicacion({ id: 'a1', nombre: 'App', idOrganizacion: 'o1', activa: true }); component.saveAplicacion(); expect(repository.update).toHaveBeenCalled();
  });
  it('procesa eventos y cambios de estado', () => {
    component.connectSse(); const app = { id: 'a1', nombre: 'App', idOrganizacion: 'o1', activa: true };
    events.next({ event: 'CREATED', aplicacion: app }); events.next({ event: 'UPDATED', aplicacion: { ...app, nombre: 'Nueva' } }); expect(component.aplicaciones[0].nombre).toBe('Nueva');
    repository.changeStatus.and.returnValue(of({ mensajes: ['estado'] })); component.changeStatus(component.aplicaciones[0]); expect(component.aplicaciones[0].activa).toBeFalse();
    events.next({ event: 'DELETED', aplicacion: app }); expect(component.aplicaciones).toEqual([]);
  });
  it('maneja fallos de carga y eliminación', () => {
    repository.findPage.and.returnValue(throwError(() => new Error('falló'))); component.loadAplicaciones(); expect(component.errorMessage).toBe('falló');
    spyOn(window, 'confirm').and.returnValue(true); repository.delete.and.returnValue(throwError(() => new Error('no eliminada'))); component.deleteAplicacion('a1'); expect(component.errorMessage).toBe('no eliminada');
  });
  it('cubre modal, paginación, SSE vacío y mensajes predeterminados', () => {
    component.aplicaciones = [{ id: 'a1', nombre: 'App', idOrganizacion: 'o1', activa: true }]; expect(component.filteredAplicaciones).toBe(component.aplicaciones);
    component.loading = true; component.changePage(2); expect(component.page).toBe(1); component.openModal(); expect(component.showModal).toBeTrue();
    const close = spyOn(component, 'closeModal'); const node = {}; component.closeModalOnOverlay({ target: node, currentTarget: node } as Event); expect(close).toHaveBeenCalled();
    component.connectSse(); events.next({ event: 'CREATED' }); events.next({ event: 'CREATED', aplicacion: component.aplicaciones[0] });
    repository.changeStatus.and.returnValue(throwError(() => ({}))); component.changeStatus(component.aplicaciones[0]); expect(component.errorMessage).toContain('estado');
  });
  it('cubre errores predeterminados de catálogos y guardado', () => {
    spyOn(console, 'error'); organizations.findAll.and.returnValue(throwError(() => new Error('orgs'))); component.loadOrganizaciones(); expect(console.error).toHaveBeenCalled();
    repository.create.and.returnValue(throwError(() => ({}))); component.aplicacionForm.setValue({ nombre: 'X', idOrganizacion: 'o1', activa: true, fechaInicio: '', fechaFinal: '' }); component.saveAplicacion(); expect(component.errorMessage).toContain('crear');
  });
  it('cubre validación, fechas, mensajes alternativos y cancelación', () => {
    component.saveAplicacion(); expect(component.errorMessage).toContain('requeridos');
    repository.create.and.returnValue(of({ mensajes: [] })); component.aplicacionForm.setValue({ nombre: 'X', idOrganizacion: 'o1', activa: true, fechaInicio: '2026-01-01', fechaFinal: '2026-12-31' }); component.saveAplicacion(); expect(component.successMessage).toContain('creada');
    repository.update.and.returnValue(of({ mensajes: [] })); component.editAplicacion({ id: 'a1', nombre: 'X', idOrganizacion: 'o1', activa: true, fechaInicio: undefined, fechaFinal: undefined }); component.saveAplicacion(); expect(component.successMessage).toContain('actualizada');
    spyOn(window, 'confirm').and.returnValue(false); component.deleteAplicacion('a1'); expect(repository.delete).not.toHaveBeenCalled();
    (window.confirm as jasmine.Spy).and.returnValue(true); repository.delete.and.returnValue(of({ mensajes: [] })); component.deleteAplicacion('a1'); expect(component.successMessage).toContain('eliminada');
  });
});
