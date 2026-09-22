import { TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { ParametroFormComponent } from './parametro-form.component';

describe('ParametroFormComponent', () => {
  it('presenta sus catálogos', async () => {
    await TestBed.configureTestingModule({ imports: [ParametroFormComponent] }).compileComponents();
    const fixture = TestBed.createComponent(ParametroFormComponent);
    fixture.componentRef.setInput('form', new FormBuilder().group({ nombre: [''], idFuncionalidad: [''], idTipoParametro: [''], activo: [true] }));
    fixture.componentRef.setInput('funcionalidades', [{ id: 'f1', nombre: 'Crear', idModulo: 'm1', activo: true }]);
    fixture.componentRef.setInput('tipos', [{ id: 't1', nombre: 'Texto' }]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Crear');
    expect(fixture.nativeElement.textContent).toContain('Texto');
  });
});
