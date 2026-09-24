const completar = (valor: number): string => String(valor).padStart(2, '0');

/** Valor local para datetime-local; nunca recortar el ISO recibido del servidor. */
export function fechaParaFormulario(fecha?: string | null): string {
  if (!fecha) return '';
  const valor = new Date(fecha);
  if (Number.isNaN(valor.getTime())) return '';
  return `${valor.getFullYear()}-${completar(valor.getMonth() + 1)}-${completar(valor.getDate())}`
    + `T${completar(valor.getHours())}:${completar(valor.getMinutes())}:${completar(valor.getSeconds())}`;
}

export function mostrarFechaLocal(fecha?: string | null): string {
  if (!fecha) return '-';
  const valor = new Date(fecha);
  return Number.isNaN(valor.getTime()) ? '-' : new Intl.DateTimeFormat(undefined, {
    dateStyle: 'short', timeStyle: 'medium'
  }).format(valor);
}

export function fechaLocalValida(fecha: string): boolean {
  if (!fecha) return true;
  const normalizada = fecha.length === 10 ? `${fecha}T00:00:00` : fecha.length === 16 ? `${fecha}:00` : fecha;
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(normalizada)
    && fechaParaFormulario(normalizada) === normalizada;
}

export function fechaConZona(fecha: string, original?: string | null): string {
  const normalizada = fecha.length === 10 ? `${fecha}T00:00:00` : fecha.length === 16 ? `${fecha}:00` : fecha;
  // Conserva precisión, offset y el instante original, incluso durante la hora repetida del cambio estacional.
  if (original && /(?:Z|[+-]\d{2}:\d{2})$/.test(original)
    && normalizada === fechaParaFormulario(original)) return original;
  if (!fechaLocalValida(fecha) || !fecha) throw new Error('La fecha y hora local no son válidas.');
  const fechaLocal = new Date(normalizada);
  const offsetMinutos = -fechaLocal.getTimezoneOffset();
  const signo = offsetMinutos >= 0 ? '+' : '-';
  const horas = String(Math.floor(Math.abs(offsetMinutos) / 60)).padStart(2, '0');
  const minutos = String(Math.abs(offsetMinutos) % 60).padStart(2, '0');

  return `${normalizada}${signo}${horas}:${minutos}`;
}
