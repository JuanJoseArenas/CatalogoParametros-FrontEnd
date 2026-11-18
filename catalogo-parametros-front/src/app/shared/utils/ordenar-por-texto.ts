const collator = new Intl.Collator('es', { sensitivity: 'base', numeric: true });

export function ordenarPorTexto<T>(items: readonly T[], texto: (item: T) => string | null | undefined): T[] {
  return [...items].sort((a, b) => collator.compare(texto(a) ?? '', texto(b) ?? ''));
}

export function ordenarPorNombre<T extends { nombre: string }>(items: readonly T[]): T[] {
  return ordenarPorTexto(items, item => item.nombre);
}
