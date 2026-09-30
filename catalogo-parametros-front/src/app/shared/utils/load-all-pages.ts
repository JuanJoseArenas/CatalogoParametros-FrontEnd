import { EMPTY, Observable, expand, reduce } from 'rxjs';

/** Recorre el catálogo completo para no truncar las opciones de los selectores. */
export function loadAllPages<T>(findPage: (page: number, pageSize: number) => Observable<T[]>): Observable<T[]> {
  const pageSize = 100;
  return findPage(1, pageSize).pipe(
    expand((items, index) => items.length === pageSize ? findPage(index + 2, pageSize) : EMPTY),
    reduce((all, items) => all.concat(items), [] as T[])
  );
}

