import { disponibleParaUso } from './disponibilidad';

describe('Disponibilidad para uso', () => {
  const ahora = Date.parse('2026-10-23T17:00:00Z');
  it('bloquea registros desactivados aunque no tengan fechas', () => {
    expect(disponibleParaUso({ activo: false }, ahora)).toBeFalse();
    expect(disponibleParaUso({ activa: false }, ahora)).toBeFalse();
  });
  it('excluye el instante final y acepta el instante inicial', () => {
    expect(disponibleParaUso({ activo: true, fechaFinal: '2026-10-23T12:00:00-05:00' }, ahora)).toBeFalse();
    expect(disponibleParaUso({ activo: true, fechaInicio: '2026-10-23T12:00:00-05:00' }, ahora)).toBeTrue();
  });
  it('acepta vigencias abiertas y bloquea inicios futuros', () => {
    expect(disponibleParaUso({ activo: true }, ahora)).toBeTrue();
    expect(disponibleParaUso({ activo: true, fechaInicio: '2026-10-24T00:00:00Z' }, ahora)).toBeFalse();
  });
  it('bloquea fechas ilegibles en una opcion de uso', () => {
    expect(disponibleParaUso({ activo: true, fechaFinal: 'incorrecta' }, ahora)).toBeFalse();
  });
});
