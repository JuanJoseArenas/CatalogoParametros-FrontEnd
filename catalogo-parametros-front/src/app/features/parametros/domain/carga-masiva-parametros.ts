export interface CargaMasivaError {
  fila: number;
  hoja: string;
  campo: string;
  valor: string;
  codigo: string;
  descripcion: string;
}

export interface CargaMasivaResultado {
  ready: boolean;
  totalFilas: number;
  filasValidas: number;
  filasInvalidas: number;
  errores: CargaMasivaError[];
}
