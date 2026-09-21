import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, Validators } from '@angular/forms';
import { RelatedEntityFormComponent } from './related-entity-form.component';

describe('RelatedEntityFormComponent', () => {
  let fixture: ComponentFixture<RelatedEntityFormComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [RelatedEntityFormComponent] }).compileComponents();
    fixture = TestBed.createComponent(RelatedEntityFormComponent);
    fixture.componentRef.setInput('form', new FormBuilder().group({ nombre: ['', Validators.required], parent: [''], active: [true], fechaInicio: [''], fechaFinal: [''] }));
    fixture.componentRef.setInput('options', [{ id: '1', name: 'Padre' }]);
    fixture.componentRef.setInput('entityLabel', 'Entidad');
    fixture.componentRef.setInput('relationLabel', 'Padre');
    fixture.componentRef.setInput('relationControl', 'parent');
    fixture.componentRef.setInput('activeControl', 'active');
    fixture.detectChanges();
  });
  it('presenta las opciones y emite cancelar', () => {
    let cancelled = false;
    fixture.componentInstance.cancel.subscribe(() => cancelled = true);
    expect(fixture.nativeElement.textContent).toContain('Padre');
    fixture.nativeElement.querySelector('.modal-close').click();
    expect(cancelled).toBeTrue();
  });
});
