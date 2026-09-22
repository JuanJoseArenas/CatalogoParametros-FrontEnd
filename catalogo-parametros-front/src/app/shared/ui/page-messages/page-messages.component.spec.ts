import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PageMessagesComponent } from './page-messages.component';

describe('PageMessagesComponent', () => {
  let fixture: ComponentFixture<PageMessagesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [PageMessagesComponent] }).compileComponents();
    fixture = TestBed.createComponent(PageMessagesComponent);
  });

  it('presenta mensajes de error y éxito', () => {
    fixture.componentRef.setInput('error', 'Error de prueba');
    fixture.componentRef.setInput('success', 'Operación correcta');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Error de prueba');
    expect(fixture.nativeElement.textContent).toContain('Operación correcta');
  });

  it('no crea alertas cuando no hay mensajes', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.alert')).toBeNull();
  });
});
