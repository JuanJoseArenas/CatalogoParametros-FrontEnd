import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { CargaMasivaParametrosComponent } from './carga-masiva-parametros.component';
import { CargaMasivaParametrosService } from '../../infrastructure/carga-masiva-parametros.service';

describe('CargaMasivaParametrosComponent', () => {
  const service = {
    descargarPlantilla: () => of(new Blob()),
    validar: (_file: File) => of({ ready: false, totalFilas: 1, filasValidas: 0, filasInvalidas: 1, errores: [{ fila: 2, hoja: 'Catalogo', campo: 'Aplicacion', valor: 'No existe', codigo: 'APPLICATION_NOT_FOUND', descripcion: 'No existe' }] }),
    cargar: (_file: File) => of({ ready: true, totalFilas: 1, filasValidas: 1, filasInvalidas: 0, errores: [] }),
    descargarReporte: (_file: File) => of(new Blob())
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CargaMasivaParametrosComponent], providers: [{ provide: CargaMasivaParametrosService, useValue: service }] }).compileComponents();
  });

  it('mantiene deshabilitada la confirmacion si el backend reporta errores', () => {
    const fixture = TestBed.createComponent(CargaMasivaParametrosComponent);
    fixture.componentInstance.resultado = { ready: false, totalFilas: 1, filasValidas: 0, filasInvalidas: 1, errores: [] };
    fixture.detectChanges();
    const buttons = Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[];
    const confirmar = buttons.find(button => button.textContent?.includes('Confirmar carga'));
    expect(confirmar?.disabled).toBeTrue();
  });

  it('habilita la confirmacion unicamente cuando no hay errores', () => {
    const fixture = TestBed.createComponent(CargaMasivaParametrosComponent);
    fixture.componentInstance.file = new File(['xlsx'], 'catalogo.xlsx');
    fixture.componentInstance.resultado = { ready: true, totalFilas: 1, filasValidas: 1, filasInvalidas: 0, errores: [] };
    fixture.detectChanges();
    const buttons = Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[];
    const confirmar = buttons.find(button => button.textContent?.includes('Confirmar carga'));
    expect(confirmar?.disabled).toBeFalse();
  });

  it('valida extension y tamano del archivo antes de enviarlo', () => {
    const fixture = TestBed.createComponent(CargaMasivaParametrosComponent);
    const component = fixture.componentInstance;
    expect(component.fileError).toBe('');
    component.file = new File(['texto'], 'catalogo.txt');
    expect(component.fileError).toContain('.xlsx');
    component.file = new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'catalogo.xlsx');
    expect(component.fileError).toContain('5 MB');
    component.file = new File(['xlsx'], 'catalogo.xlsx');
    expect(component.fileError).toBe('');
  });

  it('selecciona el archivo, valida y confirma solo el resultado listo', () => {
    const fixture = TestBed.createComponent(CargaMasivaParametrosComponent);
    const component = fixture.componentInstance;
    const selected = new File(['xlsx'], 'catalogo.xlsx');
    component.seleccionar({ target: { files: null } } as unknown as Event);
    expect(component.file).toBeNull();
    component.seleccionar({ target: { files: [selected] } } as unknown as Event);
    expect(component.file).toBe(selected);
    component.validar();
    const validate = spyOn(service, 'validar').and.returnValue(of({ ready: true, totalFilas: 1, filasValidas: 1, filasInvalidas: 0, errores: [] }));
    component.validar();
    expect(validate).toHaveBeenCalledWith(selected);
    component.confirmar();
    const load = spyOn(service, 'cargar').and.returnValue(of({ ready: true, totalFilas: 1, filasValidas: 1, filasInvalidas: 0, errores: [] }));
    component.resultado = { ready: true, totalFilas: 1, filasValidas: 1, filasInvalidas: 0, errores: [] };
    component.confirmar();
    expect(load).toHaveBeenCalledWith(selected);
  });
});
