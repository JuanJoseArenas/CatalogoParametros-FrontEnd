import { of, throwError } from 'rxjs';
import { loadAllPages } from './load-all-pages';

describe('loadAllPages', () => {
  it('consulta todas las páginas del catálogo sin truncar las opciones', () => {
    const first = Array.from({ length: 100 }, (_, id) => ({ id }));
    const findPage = jasmine.createSpy('findPage').and.returnValues(of(first), of([{ id: 100 }]));
    loadAllPages(findPage).subscribe(items => expect(items.length).toBe(101));
    expect(findPage.calls.allArgs()).toEqual([[1, 100], [2, 100]]);
  });
  it('termina en un catálogo vacío y propaga los fallos de carga', () => {
    loadAllPages(() => of([])).subscribe(items => expect(items).toEqual([]));
    loadAllPages(() => throwError(() => new Error('Sin conexión'))).subscribe({
      next: () => fail('No debe emitir un catálogo incompleto'),
      error: (error: Error) => expect(error.message).toBe('Sin conexión')
    });
  });
});

