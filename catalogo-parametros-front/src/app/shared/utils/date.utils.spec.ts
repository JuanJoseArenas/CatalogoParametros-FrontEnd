import { fechaConZona, fechaLocalValida, fechaParaFormulario, mostrarFechaLocal } from './date.utils';

describe('Fechas en la zona del navegador', () => {
  it('conserva hora y genera offsets positivos, negativos y fraccionarios', () => {
    const offset = spyOn(Date.prototype, 'getTimezoneOffset');
    for (const [minutos, esperado] of [[300, '-05:00'], [240, '-04:00'], [-330, '+05:30'], [0, '+00:00']] as const) {
      offset.and.returnValue(minutos);
      expect(fechaConZona('2026-07-15T12:34:56')).toBe('2026-07-15T12:34:56' + esperado);
    }
  });

  it('usa el offset de la fecha seleccionada y conserva los segundos', () => {
    spyOn(Date.prototype, 'getTimezoneOffset').and.callFake(function(this: Date) {
      return this.getMonth() === 0 ? 300 : 240;
    });
    expect(fechaConZona('2026-01-15T12:34')).toBe('2026-01-15T12:34:00-05:00');
    expect(fechaConZona('2026-07-15T12:34:56')).toBe('2026-07-15T12:34:56-04:00');
  });

  it('convierte instantes equivalentes al mismo valor local y texto legible', () => {
    const colombia = '2026-07-15T23:35:42-05:00';
    const utc = '2026-07-16T04:35:42Z';
    expect(fechaParaFormulario(colombia)).toBe(fechaParaFormulario(utc));
    expect(mostrarFechaLocal(colombia)).toBe(mostrarFechaLocal(utc));
    expect(mostrarFechaLocal(utc)).toBe(new Intl.DateTimeFormat(undefined, { dateStyle: 'short', timeStyle: 'medium' }).format(new Date(utc)));
  });

  it('no pierde precisi?n ni cambia el instante cuando no se edita la fecha', () => {
    const original = '2026-11-01T01:30:25.123456-05:00';
    expect(fechaConZona(fechaParaFormulario(original), original)).toBe(original);
  });

  it('valida vac?os, valores inv?lidos y fechas inexistentes', () => {
    expect(fechaParaFormulario(null)).toBe('');
    expect(fechaParaFormulario('incorrecta')).toBe('');
    expect(mostrarFechaLocal(undefined)).toBe('-');
    expect(mostrarFechaLocal('incorrecta')).toBe('-');
    expect(fechaLocalValida('')).toBeTrue();
    expect(fechaLocalValida('2026-02-30T10:00:00')).toBeFalse();
    expect(() => fechaConZona('incorrecta')).toThrow();
    expect(fechaConZona('2026-01-15')).toContain('T00:00:00');
  });
});
