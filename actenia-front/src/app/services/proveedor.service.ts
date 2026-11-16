import { Injectable } from '@angular/core';
import { Proveedor, ProveedorUpdate } from '../models/proveedor.model';
import { SupabaseService } from './supabase-services/supabase/supabase';

@Injectable({ providedIn: 'root' })
export class ProveedorService {
  constructor(private readonly supabase: SupabaseService) {}

  async getProveedores(): Promise<Proveedor[]> {
    const userId = await this.requireUserId();
    const { data, error } = await this.supabase.client
      .from('proveedores')
      .select(
        'id,nombre,direccion,telefono_fijo,telefono_celular,email,sitio_web,user_id,created_at',
      )
      .eq('user_id', userId)
      .order('nombre');

    if (error) throw error;
    return (data ?? []) as Proveedor[];
  }

  async getProveedorById(id: string): Promise<Proveedor> {
    const userId = await this.requireUserId();
    const { data, error } = await this.supabase.client
      .from('proveedores')
      .select(
        'id,nombre,direccion,telefono_fijo,telefono_celular,email,sitio_web,user_id,created_at',
      )
      .eq('user_id', userId)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Proveedor;
  }

  async createProveedor(proveedor: ProveedorUpdate): Promise<Proveedor> {
    const userId = await this.requireUserId();
    const nombre = proveedor.nombre?.trim();
    if (!nombre) throw new Error('El nombre del proveedor es obligatorio.');

    const { data, error } = await this.supabase.client
      .from('proveedores')
      .insert({
        nombre,
        direccion: this.nullIfBlank(proveedor.direccion),
        telefono_fijo: this.nullIfBlank(proveedor.telefono_fijo),
        telefono_celular: this.nullIfBlank(proveedor.telefono_celular),
        email: this.nullIfBlank(proveedor.email),
        sitio_web: this.nullIfBlank(proveedor.sitio_web),
        user_id: userId,
      })
      .select(
        'id,nombre,direccion,telefono_fijo,telefono_celular,email,sitio_web,user_id,created_at',
      )
      .single();

    if (error) throw error;
    return data as Proveedor;
  }

  async updateProveedor(id: string, changes: ProveedorUpdate): Promise<Proveedor> {
    const userId = await this.requireUserId();
    const payload: ProveedorUpdate = {};

    if (changes.nombre !== undefined) {
      const nombre = changes.nombre.trim();
      if (!nombre) throw new Error('El nombre del proveedor es obligatorio.');
      payload.nombre = nombre;
    }

    for (const field of [
      'direccion',
      'telefono_fijo',
      'telefono_celular',
      'email',
      'sitio_web',
    ] as const) {
      if (changes[field] !== undefined) {
        const value = changes[field]?.trim();
        payload[field] = value || null;
      }
    }

    if (Object.keys(payload).length === 0) {
      throw new Error('No hay cambios en los datos del proveedor.');
    }

    const { data, error } = await this.supabase.client
      .from('proveedores')
      .update(payload)
      .eq('user_id', userId)
      .eq('id', id)
      .select(
        'id,nombre,direccion,telefono_fijo,telefono_celular,email,sitio_web,user_id,created_at',
      )
      .single();

    if (error) throw error;
    return data as Proveedor;
  }

  private async requireUserId(): Promise<string> {
    const { data, error } = await this.supabase.client.auth.getUser();
    if (error) throw error;
    if (!data.user) throw new Error('Debes iniciar sesión para editar proveedores.');
    return data.user.id;
  }

  private nullIfBlank(value: string | null | undefined): string | null {
    const trimmed = value?.trim();
    return trimmed || null;
  }
}
