import { TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { MetadatoFormComponent } from './metadato-form.component';

describe('MetadatoFormComponent', () => {
  it('adapta el campo al tipo seleccionado', async () => {
    await TestBed.configureTestingModule({ imports: [MetadatoFormComponent] }).compileComponents();
    const fixture = TestBed.createComponent(MetadatoFormComponent);
    fixture.componentRef.setInput('form', new FormBuilder().group({ idParametro: [''], idTipoMetadato: [''], valor: [''] }));
    fixture.componentRef.setInput('parametros', [{ id: 'p1', nombre: 'Color', idFuncionalidad: 'f1', idTipoParametro: 't1', activo: true }]);
    fixture.componentRef.setInput('tipos', [{ id: 'json', tipo: 'json', detalle: 'JSON' }]);
    fixture.componentRef.setInput('selectedType', 'json');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('textarea')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('JSON válido');
  });
});
