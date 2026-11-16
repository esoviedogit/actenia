import { Injectable } from '@angular/core';
import { Ubicacion } from '../models/ubicacion.model';
import { SupabaseService } from './supabase-services/supabase/supabase';

const UBICACION_FIELDS = '*, sede:sedes(nombre)';

@Injectable({ providedIn: 'root' })
export class UbicacionService {
  constructor(private readonly supabase: SupabaseService) {}

  async getUbicaciones(): Promise<Ubicacion[]> {
    const userId = await this.requireUserId();
    const { data, error } = await this.supabase.client
      .from('consultorios')
      .select(UBICACION_FIELDS)
      .eq('user_id', userId)
      .order('nombre');

    if (error) throw error;
    return (data ?? []) as unknown as Ubicacion[];
  }

  async getUbicacionesBySede(sedeId: string): Promise<Ubicacion[]> {
    const normalizedSedeId = sedeId.trim();
    if (!normalizedSedeId) return [];

    const userId = await this.requireUserId();
    const { data, error } = await this.supabase.client
      .from('consultorios')
      .select(UBICACION_FIELDS)
      .eq('user_id', userId)
      .eq('sede_id', normalizedSedeId)
      .order('nombre');

    if (error) throw error;
    return (data ?? []) as unknown as Ubicacion[];
  }

  async getUbicacionById(id: string): Promise<Ubicacion> {
    const userId = await this.requireUserId();
    const { data, error } = await this.supabase.client
      .from('consultorios')
      .select(UBICACION_FIELDS)
      .eq('user_id', userId)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as unknown as Ubicacion;
  }

  async createUbicacion(ubicacion: Partial<Ubicacion>): Promise<Ubicacion> {
    const userId = await this.requireUserId();
    const nombre = ubicacion.nombre?.trim();
    const sedeId = ubicacion.sede_id?.trim();
    if (!nombre || !sedeId) {
      throw new Error('El nombre y la sede de la ubicación son obligatorios.');
    }

    const { data, error } = await this.supabase.client
      .from('consultorios')
      .insert({
        nombre,
        sede_id: sedeId,
        piso: this.nullIfBlank(ubicacion.piso),
        codigo_servicio: this.nullIfBlank(ubicacion.codigo_servicio),
        user_id: userId,
      })
      .select(UBICACION_FIELDS)
      .single();

    if (error) throw error;
    return data as unknown as Ubicacion;
  }

  async updateUbicacion(id: string, ubicacion: Partial<Ubicacion>): Promise<Ubicacion> {
    const userId = await this.requireUserId();
    const payload: {
      nombre?: string;
      sede_id?: string;
      piso?: string | null;
      codigo_servicio?: string | null;
    } = {};

    if (ubicacion.nombre !== undefined) {
      const nombre = ubicacion.nombre.trim();
      if (!nombre) throw new Error('El nombre de la ubicación es obligatorio.');
      payload.nombre = nombre;
    }
    if (ubicacion.sede_id !== undefined) {
      const sedeId = ubicacion.sede_id.trim();
      if (!sedeId) throw new Error('La sede de la ubicación es obligatoria.');
      payload.sede_id = sedeId;
    }
    if (ubicacion.piso !== undefined) payload.piso = this.nullIfBlank(ubicacion.piso);
    if (ubicacion.codigo_servicio !== undefined) {
      payload.codigo_servicio = this.nullIfBlank(ubicacion.codigo_servicio);
    }
    if (Object.keys(payload).length === 0) {
      throw new Error('Debes proporcionar al menos un campo para actualizar.');
    }

    const { data, error } = await this.supabase.client
      .from('consultorios')
      .update(payload)
      .eq('user_id', userId)
      .eq('id', id)
      .select(UBICACION_FIELDS)
      .single();

    if (error) throw error;
    return data as unknown as Ubicacion;
  }

  async deleteUbicacion(id: string): Promise<void> {
    const userId = await this.requireUserId();
    const { error } = await this.supabase.client
      .from('consultorios')
      .delete()
      .eq('user_id', userId)
      .eq('id', id);

    if (error) throw error;
  }

  private async requireUserId(): Promise<string> {
    const { data, error } = await this.supabase.client.auth.getUser();
    if (error) throw error;
    if (!data.user) throw new Error('Debes iniciar sesión para gestionar ubicaciones.');
    return data.user.id;
  }

  private nullIfBlank(value: string | null | undefined): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }
}
