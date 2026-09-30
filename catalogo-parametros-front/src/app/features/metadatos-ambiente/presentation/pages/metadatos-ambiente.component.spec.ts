import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import { EventStreamService } from '../../../../core/realtime/event-stream.service';
import { AmbientesRepository } from '../../../ambientes/domain/ambientes.repository';
import { EstadosMetadatoAmbienteRepository } from '../../../estados-metadato-ambiente/domain/estados-metadato-ambiente.repository';
import { ParametrosRepository } from '../../../parametros/domain/parametros.repository';
import { MetadatosAmbienteRepository } from '../../domain/metadatos-ambiente.repository';
import { MetadatoAmbienteEvent } from '../../domain/metadato-ambiente';
import { MetadatosAmbienteComponent } from './metadatos-ambiente.component';

describe('MetadatosAmbienteComponent', () => {
  let component: MetadatosAmbienteComponent;
  let repository: jasmine.SpyObj<MetadatosAmbienteRepository>;
  let ambientes: jasmine.SpyObj<AmbientesRepository>;
  let estados: jasmine.SpyObj<EstadosMetadatoAmbienteRepository>;
  let parametros: jasmine.SpyObj<ParametrosRepository>;
  let stream: jasmine.SpyObj<EventStreamService>;
  let events: Subject<MetadatoAmbienteEvent>;
  let catalogEvents: Subject<unknown>;
  const input = { idParametro: 'p1', idAmbiente: 'a1', idEstadoMetadatoAmbiente: 'e1' };
  const entity = { id: 'm1', ...input };

  beforeEach(() => {
    repository = jasmine.createSpyObj('metadatos', ['findPage', 'findById', 'create', 'update', 'delete'], { eventsUrl: '/metadatos-ambiente/events' });
    ambientes = jasmine.createSpyObj('ambientes', ['findPage'], { eventsUrl: '/ambientes/events' });
    estados = jasmine.createSpyObj('estados', ['findPage'], { eventsUrl: '/estados-metadato-ambiente/events' });
    parametros = jasmine.createSpyObj('parametros', ['findPage'], { eventsUrl: '/parametros/events' });
    repository.findPage.and.returnValue(of([entity]));
    repository.findById.and.returnValue(of(entity));
    repository.create.and.returnValue(of({ mensajes: ['Creado'] }));
    repository.update.and.returnValue(of({ mensajes: ['Actualizado'] }));
    repository.delete.and.returnValue(of({ mensajes: ['Eliminado'] }));
    ambientes.findPage.and.returnValue(of([{ id: 'a1', nombre: 'Producción' }]));
    estados.findPage.and.returnValue(of([{ id: 'e1', nombre: 'Aprobado' }]));
    parametros.findPage.and.returnValue(of([{ id: 'p1', nombre: 'Tiempo de espera', idFuncionalidad: 'f1', idTipoParametro: 't1', activo: true }]));
    events = new Subject();
    catalogEvents = new Subject();
    stream = jasmine.createSpyObj('stream', ['connect']);
    stream.connect.and.callFake(<T>(url: string) => (url === repository.eventsUrl ? events : catalogEvents).asObservable() as import('rxjs').Observable<T>);
    TestBed.configureTestingModule({
      imports: [MetadatosAmbienteComponent],
      providers: [
        provideRouter([]),
        { provide: MetadatosAmbienteRepository, useValue: repository },
        { provide: AmbientesRepository, useValue: ambientes },
        { provide: EstadosMetadatoAmbienteRepository, useValue: estados },
        { provide: ParametrosRepository, useValue: parametros },
        { provide: EventStreamService, useValue: stream }
      ]
    });
    component = TestBed.createComponent(MetadatosAmbienteComponent).componentInstance;
  });
  afterEach(() => component.ngOnDestroy());

  it('carga nombres de las relaciones y filtra por parámetro, ambiente o estado', () => {
    component.ngOnInit();
    expect(component.nombre(component.ambientes, 'a1')).toBe('Producción');
    for (const term of ['tiempo', 'producción', 'aprobado']) {
      component.searchTerm = term;
      expect(component.filteredMetadatos).toEqual([entity]);
    }
    component.searchTerm = 'ausente';
    expect(component.filteredMetadatos).toEqual([]);
    expect(component.nombre([], 'desconocido')).toBe('desconocido');
  });

  it('exige las tres relaciones y envía sus IDs al crear', () => {
    component.openModal();
    component.saveMetadato();
    expect(repository.create).not.toHaveBeenCalled();
    component.metadatoForm.setValue(input);
    component.saveMetadato();
    expect(repository.create).toHaveBeenCalledWith(input);
    expect(component.showModal).toBeFalse();
  });

  it('precarga y actualiza las relaciones por ID', () => {
    component.openModal(entity);
    expect(component.metadatoForm.getRawValue()).toEqual(input);
    component.saveMetadato();
    expect(repository.update).toHaveBeenCalledWith('m1', input);
    expect(component.successMessage).toBe('Actualizado');
  });

  it('conserva la selección y muestra los errores de guardado', () => {
    component.openModal(entity);
    repository.update.and.returnValue(throwError(() => new Error('Relación inválida')));
    component.saveMetadato();
    expect(component.formError).toBe('Relación inválida');
    expect(component.metadatoForm.getRawValue()).toEqual(input);
    expect(component.showModal).toBeTrue();
    expect(component.saving).toBeFalse();
  });

  it('bloquea el guardado si falla un catálogo y permite reintentar', () => {
    estados.findPage.and.returnValue(throwError(() => new Error('Sin estados')));
    component.openModal();
    component.metadatoForm.setValue(input);
    component.saveMetadato();
    expect(repository.create).not.toHaveBeenCalled();
    expect(component.catalogError).toBe('Sin estados');
    expect(component.loadingCatalogos).toBeFalse();
    estados.findPage.and.returnValue(of([{ id: 'e1', nombre: 'Aprobado' }]));
    component.loadCatalogos();
    component.saveMetadato();
    expect(repository.create).toHaveBeenCalledWith(input);
  });

  it('rechaza opciones eliminadas del catálogo durante la edición', () => {
    component.openModal(entity);
    component.estados = [];
    component.saveMetadato();
    expect(repository.update).not.toHaveBeenCalled();
    expect(component.formError).toContain('ya no está disponible');
  });

  it('consulta detalle y muestra el error de un registro inexistente', () => {
    component.consultarMetadato('m1');
    expect(component.detalle).toEqual(entity);
    repository.findById.and.returnValue(throwError(() => new Error('No encontrado')));
    component.consultarMetadato('x');
    expect(component.errorMessage).toBe('No encontrado');
    expect(component.consulting).toBeFalse();
  });

  it('respeta la confirmación y recupera una página vacía después de eliminar', () => {
    const confirm = spyOn(window, 'confirm').and.returnValue(false);
    component.deleteMetadato(entity);
    expect(repository.delete).not.toHaveBeenCalled();
    confirm.and.returnValue(true);
    component.page = 2;
    repository.findPage.and.returnValues(of([]), of([entity]));
    component.deleteMetadato(entity);
    expect(repository.delete).toHaveBeenCalledWith('m1');
    expect(component.page).toBe(1);
  });

  it('muestra errores de consulta y eliminación sin dejar la pantalla ocupada', () => {
    repository.findPage.and.returnValue(throwError(() => new Error('Carga fallida')));
    component.loadMetadatos();
    expect(component.errorMessage).toBe('Carga fallida');
    expect(component.loading).toBeFalse();
    spyOn(window, 'confirm').and.returnValue(true);
    repository.delete.and.returnValue(throwError(() => new Error('No se puede eliminar')));
    component.deleteMetadato(entity);
    expect(component.deletingId).toBeNull();
    expect(component.errorMessage).toBe('No se puede eliminar');
  });

  it('recibe el JSON real de SSE, refresca los catálogos y libera las suscripciones', () => {
    component.ngOnInit();
    expect(stream.connect).toHaveBeenCalledWith(repository.eventsUrl, 'metadatoambiente');
    component.detalle = entity;
    events.next({ event: 'UPDATED', metadatoAmbiente: { ...entity, idAmbiente: 'a2' } });
    expect(component.detalle?.idAmbiente).toBe('a2');
    events.next({ event: 'DELETED', metadatoAmbiente: entity });
    expect(component.detalle).toBeNull();
    const count = ambientes.findPage.calls.count();
    catalogEvents.next({});
    expect(ambientes.findPage.calls.count()).toBeGreaterThan(count);
    component.ngOnDestroy();
    const loads = repository.findPage.calls.count();
    events.next({ event: 'CREATED', metadatoAmbiente: entity });
    expect(repository.findPage.calls.count()).toBe(loads);
  });

  it('impide dobles envíos y el cierre mientras se guarda', () => {
    const response = new Subject<{ mensajes: string[] }>();
    repository.create.and.returnValue(response);
    component.openModal();
    component.metadatoForm.setValue(input);
    component.saveMetadato();
    component.saveMetadato();
    component.closeModal();
    expect(repository.create).toHaveBeenCalledTimes(1);
    expect(component.showModal).toBeTrue();
    response.next({ mensajes: [] });
    expect(component.showModal).toBeFalse();
  });

  it('pagina y evita consultas repetidas de detalle mientras espera la respuesta', () => {
    component.changePage(2);
    expect(repository.findPage).toHaveBeenCalledWith(2, 10);
    component.loading = true;
    component.changePage(3);
    expect(component.page).toBe(2);
    component.loading = false;
    component.changePage(0);
    expect(component.page).toBe(2);
    const pending = new Subject<typeof entity>();
    repository.findById.and.returnValue(pending);
    component.consultarMetadato('m1');
    component.consultarMetadato('m1');
    expect(repository.findById).toHaveBeenCalledTimes(1);
    pending.next(entity);
    expect(component.detalle).toEqual(entity);
  });

  it('rechaza referencias de parámetros y ambientes que ya no existen', () => {
    component.openModal(entity);
    component.metadatoForm.patchValue({ idParametro: 'ausente' });
    component.saveMetadato();
    expect(repository.update).not.toHaveBeenCalled();
    component.metadatoForm.patchValue({ idParametro: 'p1', idAmbiente: 'ausente' });
    component.saveMetadato();
    expect(repository.update).not.toHaveBeenCalled();
    expect(component.formError).toContain('ya no está disponible');
  });

  it('renderiza los nombres y tres selectores vinculados al formulario', () => {
    const fixture = TestBed.createComponent(MetadatosAmbienteComponent);
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('tbody')?.textContent).toContain('Tiempo de espera');
    expect(element.querySelector('tbody')?.textContent).toContain('Producción');
    (element.querySelector('.page-header .btn-primary') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(element.querySelectorAll('select').length).toBe(3);
    expect(element.querySelector('button[type="submit"]')?.hasAttribute('disabled')).toBeTrue();
    fixture.destroy();
  });
});
