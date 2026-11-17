import { Injectable } from '@angular/core';
import type { TipoMantenimiento } from '../models/tipo-mantenimiento.model';
import { SupabaseService } from './supabase-services/supabase/supabase';

@Injectable({ providedIn: 'root' })
export class TipoMantenimientoService {
  constructor(private readonly supabase: SupabaseService) {}

  async getTiposMantenimiento(): Promise<TipoMantenimiento[]> {
    const { data: sessionData, error: sessionError } = await this.supabase.client.auth.getUser();
    if (sessionError) throw sessionError;
    if (!sessionData.user) {
      throw new Error('Debes iniciar sesión para consultar los tipos de mantenimiento.');
    }

    const { data, error } = await this.supabase.client
      .from('tipos_mantenimiento_maestro')
      .select('id,nombre,descripcion,activo,user_id')
      .eq('activo', true)
      .or(`user_id.is.null,user_id.eq.${sessionData.user.id}`)
      .order('nombre');

    if (error) throw error;
    return (data ?? []) as TipoMantenimiento[];
  }
}
