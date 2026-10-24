/** Solo evalua campos existentes; no incorpora estados a catalogos que no los tienen. */
export function disponibleParaUso(registro: {
  activo?: boolean; activa?: boolean; fechaInicio?: string | null; fechaFinal?: string | null;
}, ahora = Date.now()): boolean {
  if (registro.activo === false || registro.activa === false) return false;
  const inicio = registro.fechaInicio ? Date.parse(registro.fechaInicio) : -Infinity;
  const fin = registro.fechaFinal ? Date.parse(registro.fechaFinal) : Infinity;
  return inicio <= ahora && ahora < fin;
}
