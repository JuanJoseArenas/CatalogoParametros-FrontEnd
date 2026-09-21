import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConnectionStatusComponent } from './connection-status.component';

describe('ConnectionStatusComponent', () => {
  let fixture: ComponentFixture<ConnectionStatusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ConnectionStatusComponent] }).compileComponents();
    fixture = TestBed.createComponent(ConnectionStatusComponent);
  });

  it('muestra el estado conectado', () => {
    fixture.componentRef.setInput('connected', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('En vivo');
  });

  it('muestra el estado desconectado por defecto', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Desconectado');
  });
});
