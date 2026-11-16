export interface Ubicacion {
  id?: string;
  nombre: string;
  piso?: string;
  codigo_servicio?: string;
  sede_id: string;
  user_id?: string;
  created_at?: string;
  sede?: { nombre: string } | null;
}
