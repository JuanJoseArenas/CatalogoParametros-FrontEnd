export interface Organizacion {
  id: string;
  nombre: string;
  fechaInicio?: string;
  fechaFinal?: string;
}

export type OrganizacionInput = Omit<Organizacion, 'id'>;
