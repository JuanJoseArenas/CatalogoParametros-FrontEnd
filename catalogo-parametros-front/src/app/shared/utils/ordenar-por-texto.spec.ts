import { ordenarPorNombre, ordenarPorTexto } from './ordenar-por-texto';

describe('ordenarPorTexto', () => {
  it('ordena ignorando mayúsculas y tildes', () => {
    expect(ordenarPorNombre([{ nombre: 'Zeta' }, { nombre: 'Árbol' }, { nombre: 'beta' }]))
      .toEqual([{ nombre: 'Árbol' }, { nombre: 'beta' }, { nombre: 'Zeta' }]);
  });

  it('permite ordenar por una propiedad relacionada', () => {
    const items = [{ tipo: 'JSON' }, { tipo: 'alfanumérico' }];
    expect(ordenarPorTexto(items, item => item.tipo).map(item => item.tipo))
      .toEqual(['alfanumérico', 'JSON']);
  });
});
