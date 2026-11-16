import { Injectable } from '@angular/core';
import {
  EquipmentMaintenance,
  EquipmentMaintenancePayload,
} from '../models/equipment-maintenance.model';
import { SupabaseService } from './supabase-services/supabase/supabase';

const MAINTENANCE_SELECT = '*, proveedor:proveedores(id,nombre)';

@Injectable({ providedIn: 'root' })
export class EquipmentMaintenanceService {
  constructor(private readonly supabase: SupabaseService) {}

  async listByEquipment(equipmentId: string): Promise<EquipmentMaintenance[]> {
    const userId = await this.requireUserId();
    const { data, error } = await this.supabase.client
      .from('mantenimientos_equipos')
      .select(MAINTENANCE_SELECT)
      .eq('user_id', userId)
      .eq('equipo_id', equipmentId)
      .order('fecha', { ascending: false });

    if (error) throw error;
    return (data ?? []) as EquipmentMaintenance[];
  }

  async create(payload: EquipmentMaintenancePayload): Promise<EquipmentMaintenance> {
    const userId = await this.requireUserId();
    const descripcion = payload.descripcion.trim();
    if (!descripcion) throw new Error('Describe el trabajo realizado.');
    if (!payload.fecha) throw new Error('La fecha de intervención es obligatoria.');
    if (payload.costo !== undefined && payload.costo !== null && payload.costo < 0) {
      throw new Error('El costo no puede ser negativo.');
    }

    const { data, error } = await this.supabase.client
      .from('mantenimientos_equipos')
      .insert({
        ...payload,
        descripcion,
        proveedor_id: payload.proveedor_id || null,
        costo: payload.costo ?? null,
        proxima_fecha: payload.proxima_fecha || null,
        user_id: userId,
      })
      .select(MAINTENANCE_SELECT)
      .single();

    if (error) throw error;
    return data as EquipmentMaintenance;
  }

  private async requireUserId(): Promise<string> {
    const { data, error } = await this.supabase.client.auth.getUser();
    if (error) throw error;
    if (!data.user) throw new Error('Debes iniciar sesión para gestionar mantenimientos.');
    return data.user.id;
  }
}
