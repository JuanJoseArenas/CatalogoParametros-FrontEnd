import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { EventStreamService } from '../../../../core/realtime/event-stream.service';
import { EstadoMetadatoAmbienteEvent } from '../../domain/estado-metadato-ambiente';
import { EstadosMetadatoAmbienteRepository } from '../../domain/estados-metadato-ambiente.repository';
import { EstadosMetadatoAmbienteComponent } from './estados-metadato-ambiente.component';

describe('EstadosMetadatoAmbienteComponent', () => {
  let component: EstadosMetadatoAmbienteComponent;
  let repository: jasmine.SpyObj<EstadosMetadatoAmbienteRepository>;
  let events: Subject<EstadoMetadatoAmbienteEvent>;
  const estadoMetadatoAmbiente = { id: 'a1', nombre: 'Producción' };

  beforeEach(() => {
    repository = jasmine.createSpyObj('estadosMetadatoAmbiente', ['findPage', 'findById', 'create', 'update', 'delete'], { eventsUrl: '/estados-metadato-ambiente/events' });
    repository.findPage.and.returnValue(of([estadoMetadatoAmbiente]));
    repository.create.and.returnValue(of({ mensajes: ['Creado'] }));
    repository.update.and.returnValue(of({ mensajes: ['Actualizado'] }));
    repository.delete.and.returnValue(of({ mensajes: ['Eliminado'] }));
    repository.findById.and.returnValue(of(estadoMetadatoAmbiente));
    events = new Subject<EstadoMetadatoAmbienteEvent>();
    const stream = jasmine.createSpyObj<EventStreamService>('events', ['connect']);
    stream.connect.and.returnValue(events);
    TestBed.configureTestingModule({
      imports: [EstadosMetadatoAmbienteComponent],
      providers: [{ provide: EstadosMetadatoAmbienteRepository, useValue: repository }, { provide: EventStreamService, useValue: stream }]
    });
    component = TestBed.createComponent(EstadosMetadatoAmbienteComponent).componentInstance;
  });
  afterEach(() => component.ngOnDestroy());

  it('rechaza nombres vacíos y normaliza el nombre antes de crear', () => {
    component.openModal();
    component.estadoMetadatoAmbienteForm.setValue({ nombre: '   ' });
    component.saveEstadoMetadatoAmbiente();
    expect(repository.create).not.toHaveBeenCalled();
    component.estadoMetadatoAmbienteForm.setValue({ nombre: ' Desarrollo ' });
    component.saveEstadoMetadatoAmbiente();
    expect(repository.create).toHaveBeenCalledWith({ nombre: 'Desarrollo' });
    expect(component.showModal).toBeFalse();
  });

  it('edita por ID y conserva el formulario ante un conflicto', () => {
    component.openModal(estadoMetadatoAmbiente);
    component.estadoMetadatoAmbienteForm.setValue({ nombre: 'Pruebas' });
    repository.update.and.returnValue(throwError(() => new Error('Nombre duplicado')));
    component.saveEstadoMetadatoAmbiente();
    expect(repository.update).toHaveBeenCalledWith('a1', { nombre: 'Pruebas' });
    expect(component.showModal).toBeTrue();
    expect(component.formError).toBe('Nombre duplicado');
    expect(component.saving).toBeFalse();
  });

  it('consulta el detalle y comunica errores de consulta', () => {
    component.consultarEstadoMetadatoAmbiente('a1');
    expect(component.detalle).toEqual(estadoMetadatoAmbiente);
    repository.findById.and.returnValue(throwError(() => new Error('No encontrado')));
    component.consultarEstadoMetadatoAmbiente('ausente');
    expect(component.errorMessage).toBe('No encontrado');
    expect(component.consulting).toBeFalse();
  });

  it('respeta la cancelación al eliminar y retrocede si la página queda vacía', () => {
    const confirm = spyOn(window, 'confirm').and.returnValue(false);
    component.deleteEstadoMetadatoAmbiente(estadoMetadatoAmbiente);
    expect(repository.delete).not.toHaveBeenCalled();
    confirm.and.returnValue(true);
    component.page = 2;
    repository.findPage.and.returnValues(of([]), of([estadoMetadatoAmbiente]));
    component.deleteEstadoMetadatoAmbiente(estadoMetadatoAmbiente);
    expect(repository.delete).toHaveBeenCalledWith('a1');
    expect(component.page).toBe(1);
    expect(repository.findPage).toHaveBeenCalledWith(1, 10);
  });

  it('muestra errores de carga y eliminación y libera el estado ocupado', () => {
    repository.findPage.and.returnValue(throwError(() => new Error('Error de carga')));
    component.loadEstadosMetadatoAmbiente();
    expect(component.loading).toBeFalse();
    expect(component.errorMessage).toBe('Error de carga');
    spyOn(window, 'confirm').and.returnValue(true);
    repository.delete.and.returnValue(throwError(() => new Error('En uso')));
    component.deleteEstadoMetadatoAmbiente(estadoMetadatoAmbiente);
    expect(component.deletingId).toBeNull();
    expect(component.errorMessage).toBe('En uso');
  });

  it('recarga la página ante cada evento y libera la suscripción al salir', () => {
    component.ngOnInit();
    repository.findPage.calls.reset();
    for (const event of ['CREATED', 'UPDATED', 'DELETED'] as const) events.next({ event, estadoMetadatoAmbiente });
    expect(repository.findPage).toHaveBeenCalledTimes(3);
    component.ngOnDestroy();
    events.next({ event: 'CREATED', estadoMetadatoAmbiente });
    expect(repository.findPage).toHaveBeenCalledTimes(3);
  });

  it('impide envíos duplicados mientras se guarda', () => {
    const response = new Subject<{ mensajes: string[] }>();
    repository.create.and.returnValue(response);
    component.openModal();
    component.estadoMetadatoAmbienteForm.setValue({ nombre: 'Pruebas' });
    component.saveEstadoMetadatoAmbiente();
    component.saveEstadoMetadatoAmbiente();
    component.closeModal();
    expect(repository.create).toHaveBeenCalledTimes(1);
    expect(component.showModal).toBeTrue();
    response.next({ mensajes: ['Creado'] });
    expect(component.showModal).toBeFalse();
  });

  it('actualiza un estado y sincroniza el detalle abierto con eventos externos', () => {
    component.ngOnInit();
    component.openModal(estadoMetadatoAmbiente);
    component.estadoMetadatoAmbienteForm.setValue({ nombre: 'Nuevo estado' });
    component.saveEstadoMetadatoAmbiente();
    expect(repository.update).toHaveBeenCalledWith('a1', { nombre: 'Nuevo estado' });
    expect(component.successMessage).toBe('Actualizado');
    component.consultarEstadoMetadatoAmbiente('a1');
    events.next({ event: 'UPDATED', estadoMetadatoAmbiente: { ...estadoMetadatoAmbiente, nombre: 'Renombrado' } });
    expect(component.detalle?.nombre).toBe('Renombrado');
    events.next({ event: 'DELETED', estadoMetadatoAmbiente });
    expect(component.detalle).toBeNull();
  });

  it('pagina y evita navegar mientras hay una consulta pendiente', () => {
    component.changePage(2);
    expect(repository.findPage).toHaveBeenCalledWith(2, 10);
    component.loading = true;
    component.changePage(3);
    expect(component.page).toBe(2);
    component.loading = false;
    component.changePage(0);
    expect(component.page).toBe(2);
    component.searchTerm = 'ausente';
    expect(component.filteredEstadosMetadatoAmbiente).toEqual([]);
  });

  it('conserva mensajes útiles cuando una operación no devuelve mensajes', () => {
    repository.create.and.returnValue(of({ mensajes: [] }));
    component.openModal();
    component.estadoMetadatoAmbienteForm.setValue({ nombre: 'Nuevo estado' });
    component.saveEstadoMetadatoAmbiente();
    expect(component.successMessage).toBe('Estado guardado.');
    spyOn(window, 'confirm').and.returnValue(true);
    repository.delete.and.returnValue(of({ mensajes: [] }));
    component.deleteEstadoMetadatoAmbiente(estadoMetadatoAmbiente);
    expect(component.successMessage).toBe('Estado eliminado.');
  });

  it('renderiza el listado y abre un formulario reactivo desde el botón', () => {
    const fixture = TestBed.createComponent(EstadosMetadatoAmbienteComponent);
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('tbody')?.textContent).toContain('Producción');
    (element.querySelector('.page-header .btn-primary') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(element.querySelector('[role="dialog"]')).not.toBeNull();
    expect(element.querySelector('button[type="submit"]')?.hasAttribute('disabled')).toBeTrue();
    fixture.destroy();
  });
});
