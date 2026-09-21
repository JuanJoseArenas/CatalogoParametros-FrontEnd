import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { OrganizacionFormComponent } from './organizacion-form.component';

describe('OrganizacionFormComponent', () => {
  let fixture: ComponentFixture<OrganizacionFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [OrganizacionFormComponent] }).compileComponents();
    fixture = TestBed.createComponent(OrganizacionFormComponent);
    fixture.componentRef.setInput('form', new FormBuilder().group({ nombre: [''], fechaInicio: [''], fechaFinal: [''] }));
    fixture.detectChanges();
  });

  it('emite guardar y cancelar', () => {
    let saves = 0;
    let cancels = 0;
    fixture.componentInstance.save.subscribe(() => saves++);
    fixture.componentInstance.cancel.subscribe(() => cancels++);

    const buttons = fixture.nativeElement.querySelectorAll('button');
    buttons[2].click();
    buttons[0].click();

    expect(saves).toBe(1);
    expect(cancels).toBe(1);
  });

  it('cancela al hacer clic directamente en el fondo', () => {
    let cancels = 0;
    fixture.componentInstance.cancel.subscribe(() => cancels++);
    const overlay = fixture.nativeElement.querySelector('.modal-overlay');
    overlay.click();
    expect(cancels).toBe(1);
  });
});
