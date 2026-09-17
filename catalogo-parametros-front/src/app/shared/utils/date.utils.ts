export function fechaConZona(fecha: string): string {
  const fechaLocal = new Date(`${fecha}T00:00:00`);
  const offsetMinutos = -fechaLocal.getTimezoneOffset();
  const signo = offsetMinutos >= 0 ? '+' : '-';
  const horas = String(Math.floor(Math.abs(offsetMinutos) / 60)).padStart(2, '0');
  const minutos = String(Math.abs(offsetMinutos) % 60).padStart(2, '0');

  return `${fecha}T00:00:00${signo}${horas}:${minutos}`;
}
