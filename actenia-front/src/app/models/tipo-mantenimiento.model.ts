export interface TipoMantenimiento {
  id: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  user_id: string | null;
}
