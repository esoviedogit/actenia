export interface Proveedor {
  id: string;
  nombre: string;
  direccion: string | null;
  telefono_fijo: string | null;
  telefono_celular: string | null;
  email: string | null;
  sitio_web: string | null;
  user_id?: string | null;
  created_at?: string;
}

export type ProveedorUpdate = Partial<
  Pick<
    Proveedor,
    'nombre' | 'direccion' | 'telefono_fijo' | 'telefono_celular' | 'email' | 'sitio_web'
  >
>;
