import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase-services/supabase/supabase';
import { Sede } from '../models/sede.model';

@Injectable({ providedIn: 'root' })
export class SedeService {
  constructor(private readonly supabase: SupabaseService) {}

  async getSedes(): Promise<Sede[]> {
    const userId = await this.requireUserId();
    const { data, error } = await this.supabase.client
      .from('sedes')
      .select('*')
      .eq('user_id', userId)
      .order('nombre');

    if (error) throw error;
    return (data ?? []) as Sede[];
  }

  async getSedeById(id: string): Promise<Sede> {
    const userId = await this.requireUserId();
    const { data, error } = await this.supabase.client
      .from('sedes')
      .select('*')
      .eq('user_id', userId)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Sede;
  }

  async createSede(sede: Partial<Sede>): Promise<Sede> {
    const userId = await this.requireUserId();
    const nombre = sede.nombre?.trim();
    const ciudad = sede.ciudad?.trim();
    if (!nombre || !ciudad) {
      throw new Error('El nombre de la sede y la ciudad son obligatorios.');
    }

    const { direccion, telefono, codigo_habilitacion, empresa } = sede;
    const { data, error } = await this.supabase.client
      .from('sedes')
      .insert({
        nombre,
        direccion: this.nullIfBlank(direccion),
        telefono: this.nullIfBlank(telefono),
        ciudad,
        codigo_habilitacion: this.nullIfBlank(codigo_habilitacion),
        empresa: this.nullIfBlank(empresa),
        user_id: userId,
      })
      .select('*')
      .single();

    if (error) throw error;
    return data as Sede;
  }

  async updateSede(id: string, sede: Partial<Sede>): Promise<Sede> {
    const userId = await this.requireUserId();
    const payload: {
      [key in 'nombre' | 'direccion' | 'telefono' | 'ciudad' | 'codigo_habilitacion' | 'empresa']?:
        string | null;
    } = {};
    if (sede.nombre !== undefined) {
      const nombre = sede.nombre.trim();
      if (!nombre) throw new Error('El nombre de la sede es obligatorio.');
      payload.nombre = nombre;
    }
    if (sede.ciudad !== undefined) {
      const ciudad = sede.ciudad.trim();
      if (!ciudad) throw new Error('La ciudad es obligatoria.');
      payload.ciudad = ciudad;
    }
    if (sede.direccion !== undefined) payload.direccion = this.nullIfBlank(sede.direccion);
    if (sede.telefono !== undefined) payload.telefono = this.nullIfBlank(sede.telefono);
    if (sede.codigo_habilitacion !== undefined) {
      payload.codigo_habilitacion = this.nullIfBlank(sede.codigo_habilitacion);
    }
    if (sede.empresa !== undefined) payload.empresa = this.nullIfBlank(sede.empresa);
    if (Object.keys(payload).length === 0) {
      throw new Error('Debes proporcionar al menos un campo para actualizar.');
    }

    const { data, error } = await this.supabase.client
      .from('sedes')
      .update(payload)
      .eq('user_id', userId)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    return data as Sede;
  }

  private async requireUserId(): Promise<string> {
    const { data, error } = await this.supabase.client.auth.getUser();
    if (error) throw error;
    if (!data.user) throw new Error('Debes iniciar sesión para gestionar sedes.');
    return data.user.id;
  }

  private nullIfBlank(value: string | null | undefined): string | null {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
  }
}
