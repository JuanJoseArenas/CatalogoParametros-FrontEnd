import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { EventStreamService } from '../../../../core/realtime/event-stream.service';
import { AmbienteEvent } from '../../domain/ambiente';
import { AmbientesRepository } from '../../domain/ambientes.repository';
import { AmbientesComponent } from './ambientes.component';

describe('AmbientesComponent', () => {
  let component: AmbientesComponent;
  let repository: jasmine.SpyObj<AmbientesRepository>;
  let events: Subject<AmbienteEvent>;
  const ambiente = { id: 'a1', nombre: 'Producción' };

  beforeEach(() => {
    repository = jasmine.createSpyObj('ambientes', ['findPage', 'findById', 'create', 'update', 'delete'], { eventsUrl: '/ambientes/events' });
    repository.findPage.and.returnValue(of([ambiente]));
    repository.create.and.returnValue(of({ mensajes: ['Creado'] }));
    repository.update.and.returnValue(of({ mensajes: ['Actualizado'] }));
    repository.delete.and.returnValue(of({ mensajes: ['Eliminado'] }));
    repository.findById.and.returnValue(of(ambiente));
    events = new Subject<AmbienteEvent>();
    const stream = jasmine.createSpyObj<EventStreamService>('events', ['connect']);
    stream.connect.and.returnValue(events);
    TestBed.configureTestingModule({
      imports: [AmbientesComponent],
      providers: [{ provide: AmbientesRepository, useValue: repository }, { provide: EventStreamService, useValue: stream }]
    });
    component = TestBed.createComponent(AmbientesComponent).componentInstance;
  });
  afterEach(() => component.ngOnDestroy());

  it('rechaza nombres vacíos y normaliza el nombre antes de crear', () => {
    component.openModal();
    component.ambienteForm.setValue({ nombre: '   ' });
    component.saveAmbiente();
    expect(repository.create).not.toHaveBeenCalled();
    component.ambienteForm.setValue({ nombre: ' Desarrollo ' });
    component.saveAmbiente();
    expect(repository.create).toHaveBeenCalledWith({ nombre: 'Desarrollo' });
    expect(component.showModal).toBeFalse();
  });

  it('edita por ID y conserva el formulario ante un conflicto', () => {
    component.openModal(ambiente);
    component.ambienteForm.setValue({ nombre: 'Pruebas' });
    repository.update.and.returnValue(throwError(() => new Error('Nombre duplicado')));
    component.saveAmbiente();
    expect(repository.update).toHaveBeenCalledWith('a1', { nombre: 'Pruebas' });
    expect(component.showModal).toBeTrue();
    expect(component.formError).toBe('Nombre duplicado');
    expect(component.saving).toBeFalse();
  });

  it('consulta el detalle y comunica errores de consulta', () => {
    component.consultarAmbiente('a1');
    expect(component.detalle).toEqual(ambiente);
    repository.findById.and.returnValue(throwError(() => new Error('No encontrado')));
    component.consultarAmbiente('ausente');
    expect(component.errorMessage).toBe('No encontrado');
    expect(component.consulting).toBeFalse();
  });

  it('respeta la cancelación al eliminar y retrocede si la página queda vacía', () => {
    const confirm = spyOn(window, 'confirm').and.returnValue(false);
    component.deleteAmbiente(ambiente);
    expect(repository.delete).not.toHaveBeenCalled();
    confirm.and.returnValue(true);
    component.page = 2;
    repository.findPage.and.returnValues(of([]), of([ambiente]));
    component.deleteAmbiente(ambiente);
    expect(repository.delete).toHaveBeenCalledWith('a1');
    expect(component.page).toBe(1);
    expect(repository.findPage).toHaveBeenCalledWith(1, 10);
  });

  it('muestra errores de carga y eliminación y libera el estado ocupado', () => {
    repository.findPage.and.returnValue(throwError(() => new Error('Error de carga')));
    component.loadAmbientes();
    expect(component.loading).toBeFalse();
    expect(component.errorMessage).toBe('Error de carga');
    spyOn(window, 'confirm').and.returnValue(true);
    repository.delete.and.returnValue(throwError(() => new Error('En uso')));
    component.deleteAmbiente(ambiente);
    expect(component.deletingId).toBeNull();
    expect(component.errorMessage).toBe('En uso');
  });

  it('recarga la página ante cada evento y libera la suscripción al salir', () => {
    component.ngOnInit();
    repository.findPage.calls.reset();
    for (const event of ['CREATED', 'UPDATED', 'DELETED'] as const) events.next({ event, ambiente });
    expect(repository.findPage).toHaveBeenCalledTimes(3);
    component.ngOnDestroy();
    events.next({ event: 'CREATED', ambiente });
    expect(repository.findPage).toHaveBeenCalledTimes(3);
  });

  it('impide envíos duplicados mientras se guarda', () => {
    const response = new Subject<{ mensajes: string[] }>();
    repository.create.and.returnValue(response);
    component.openModal();
    component.ambienteForm.setValue({ nombre: 'Pruebas' });
    component.saveAmbiente();
    component.saveAmbiente();
    component.closeModal();
    expect(repository.create).toHaveBeenCalledTimes(1);
    expect(component.showModal).toBeTrue();
    response.next({ mensajes: ['Creado'] });
    expect(component.showModal).toBeFalse();
  });

  it('renderiza el listado y abre un formulario reactivo desde el botón', () => {
    const fixture = TestBed.createComponent(AmbientesComponent);
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

