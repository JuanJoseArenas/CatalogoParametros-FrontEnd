import { FormBuilder } from '@angular/forms';
import { of, Subject, throwError } from 'rxjs';
import { EventStreamService } from '../../../../core/realtime/event-stream.service';
import { Organizacion } from '../../domain/organizacion';
import { OrganizacionesRepository } from '../../domain/organizaciones.repository';
import { OrganizacionesComponent } from './organizaciones.component';

describe('OrganizacionesComponent', () => {
  let component: OrganizacionesComponent;
  let repository: jasmine.SpyObj<OrganizacionesRepository>;
  let events: Subject<unknown>;

  beforeEach(() => {
    repository = jasmine.createSpyObj<OrganizacionesRepository>('repository', ['findPage', 'findAll', 'create', 'update', 'delete'], { eventsUrl: '/events' });
    events = new Subject();
    const stream = jasmine.createSpyObj<EventStreamService>('events', ['connect']);
    stream.connect.and.returnValue(events);
    repository.findPage.and.returnValue(of([]));
    component = new OrganizacionesComponent(repository, new FormBuilder(), stream);
  });

  it('inicializa, carga datos y filtra por nombre', () => {
    const data: Organizacion[] = [{ id: '1', nombre: 'UCO' }, { id: '2', nombre: 'Otra' }];
    repository.findPage.and.returnValue(of(data));
    component.ngOnInit();
    expect(component.organizaciones).toEqual(data);
    component.searchTerm = 'uco';
    expect(component.filteredOrganizaciones).toEqual([data[0]]);
    expect(repository.findPage).toHaveBeenCalledWith(1, 10);
  });

  it('gestiona errores y paginación', () => {
    repository.findPage.and.returnValue(throwError(() => new Error('falló')));
    component.loadOrganizaciones();
    expect(component.errorMessage).toBe('falló');
    expect(component.loading).toBeFalse();
    component.loading = false; repository.findPage.and.returnValue(of([])); component.changePage(2);
    expect(component.page).toBe(2);
    component.changePage(0); expect(component.page).toBe(2);
  });

  it('procesa creación, actualización y eliminación por SSE', () => {
    component.connectSse();
    const original = { id: '1', nombre: 'Inicial' };
    events.next({ event: 'CREATED', organizacion: original });
    expect(component.organizaciones).toEqual([original]);
    events.next({ event: 'UPDATED', organizacion: { ...original, nombre: 'Actualizada' } });
    expect(component.organizaciones[0].nombre).toBe('Actualizada');
    events.next({ event: 'DELETED', organizacion: original });
    expect(component.organizaciones).toEqual([]);
    events.error(new Error()); expect(component.isConnected).toBeFalse();
  });

  it('valida y crea una organización', () => {
    component.saveOrganizacion(); expect(component.errorMessage).toBe('El nombre es requerido');
    repository.create.and.returnValue(of({ mensajes: ['creada'] }));
    component.openModal();
    component.organizacionForm.setValue({ nombre: 'UCO', fechaInicio: '2026-01-01', fechaFinal: '2026-12-31' });
    component.saveOrganizacion();
    expect(repository.create).toHaveBeenCalled();
    expect(component.successMessage).toBe('creada');
    expect(component.showModal).toBeFalse();
  });

  it('edita y reporta errores al guardar', () => {
    const item = { id: '1', nombre: 'UCO', fechaInicio: '2026-01-01T00:00:00' };
    component.editOrganizacion(item);
    expect(component.organizacionForm.value.fechaInicio).toBe('2026-01-01');
    repository.update.and.returnValue(throwError(() => new Error('no actualizado')));
    component.saveOrganizacion();
    expect(repository.update).toHaveBeenCalledWith('1', jasmine.any(Object));
    expect(component.errorMessage).toBe('no actualizado');
  });

  it('elimina solo después de confirmar y destruye suscripciones', () => {
    spyOn(window, 'confirm').and.returnValue(false); component.deleteOrganizacion('1'); expect(repository.delete).not.toHaveBeenCalled();
    (window.confirm as jasmine.Spy).and.returnValue(true); repository.delete.and.returnValue(of({ mensajes: ['eliminada'] })); component.deleteOrganizacion('1');
    expect(component.successMessage).toBe('eliminada');
    component.connectSse(); component.ngOnDestroy(); expect(events.observed).toBeFalse();
  });

  it('cubre valores por defecto, modal y ramas sin acción', () => {
    component.organizaciones = [{ id: '1', nombre: 'UCO' }]; expect(component.filteredOrganizaciones).toBe(component.organizaciones);
    component.loading = true; component.changePage(3); expect(component.page).toBe(1);
    const close = spyOn(component, 'closeModal'); const child = {}; component.closeModalOnOverlay({ target: child, currentTarget: {} } as Event); expect(close).not.toHaveBeenCalled();
    component.closeModalOnOverlay({ target: child, currentTarget: child } as Event); expect(close).toHaveBeenCalled();
    component.connectSse(); events.next({ event: 'CREATED' }); events.next({ event: 'CREATED', organizacion: { id: '1', nombre: 'UCO' } }); expect(component.organizaciones.length).toBe(1);
  });

  it('usa mensajes predeterminados y errores predeterminados', () => {
    repository.create.and.returnValue(of({ mensajes: [] })); component.organizacionForm.patchValue({ nombre: 'X' }); component.saveOrganizacion(); expect(component.successMessage).toContain('creada');
    repository.create.and.returnValue(throwError(() => ({}))); component.organizacionForm.patchValue({ nombre: 'X' }); component.saveOrganizacion(); expect(component.errorMessage).toContain('crear');
    spyOn(window, 'confirm').and.returnValue(true); repository.delete.and.returnValue(throwError(() => ({}))); component.deleteOrganizacion('1'); expect(component.errorMessage).toContain('eliminar');
  });
});
