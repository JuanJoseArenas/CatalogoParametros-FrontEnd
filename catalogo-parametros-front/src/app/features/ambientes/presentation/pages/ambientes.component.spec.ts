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
  const ambiente = { id: 'a1', nombre: 'Produccion', activo: true };

  beforeEach(() => {
    repository = jasmine.createSpyObj('ambientes', ['findPage', 'findById', 'create', 'update', 'delete'], { eventsUrl: '/ambientes/events' });
    repository.findPage.and.returnValue(of([ambiente]));
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

  it('carga los ambientes desde el repositorio del backend', () => {
    component.loadAmbientes();
    expect(repository.findPage).toHaveBeenCalledWith(1, 10);
    expect(component.ambientes).toEqual([ambiente]);
  });

  it('consulta el detalle y comunica errores de consulta', () => {
    component.consultarAmbiente('a1');
    expect(repository.findById).toHaveBeenCalledWith('a1');
    expect(component.detalle).toEqual(ambiente);
    repository.findById.and.returnValue(throwError(() => new Error('No encontrado')));
    component.consultarAmbiente('ausente');
    expect(component.errorMessage).toBe('No encontrado');
    expect(component.consulting).toBeFalse();
  });

  it('retrocede si una pagina posterior queda vacia', () => {
    component.page = 2;
    repository.findPage.and.returnValues(of([]), of([ambiente]));
    component.loadAmbientes();
    expect(component.page).toBe(1);
    expect(repository.findPage).toHaveBeenCalledWith(1, 10);
  });

  it('muestra errores de carga', () => {
    repository.findPage.and.returnValue(throwError(() => new Error('Error de carga')));
    component.loadAmbientes();
    expect(component.loading).toBeFalse();
    expect(component.errorMessage).toBe('Error de carga');
  });

  it('recarga la pagina ante eventos y libera la suscripcion al salir', () => {
    component.ngOnInit();
    repository.findPage.calls.reset();
    for (const event of ['CREATED', 'UPDATED', 'DELETED'] as const) events.next({ event, ambiente });
    expect(repository.findPage).toHaveBeenCalledTimes(3);
    component.ngOnDestroy();
    events.next({ event: 'CREATED', ambiente });
    expect(repository.findPage).toHaveBeenCalledTimes(3);
  });

  it('renderiza el estado y las acciones del ambiente', () => {
    const fixture = TestBed.createComponent(AmbientesComponent);
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('tbody')?.textContent).toContain('Activo');
    expect(element.querySelector('.page-header .btn-primary')?.textContent).toContain('Nuevo ambiente');
    expect(element.querySelector('button[type="submit"]')).toBeNull();
    fixture.destroy();
  });
});
