import { Injectable } from '@angular/core';
import { EquipmentType, EquipmentTypePayload } from '../models/equipment-type.model';
import { EquipmentImageService } from './equipment-image.service';
import { SupabaseService } from './supabase-services/supabase/supabase';

export type {
  EquipmentRiskClassification,
  EquipmentType,
  EquipmentTypePayload,
} from '../models/equipment-type.model';

@Injectable({ providedIn: 'root' })
export class EquipmentTypeService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly equipmentImageService: EquipmentImageService,
  ) {}

  async getEquipmentTypes(): Promise<EquipmentType[]> {
    const userId = await this.requireUserId();

    const { data, error } = await this.supabase.client
      .from('tipos_equipo')
      .select('id,nombre,imagen_url,user_id,clasificacion_riesgo,frecuencia_mantenimiento_meses')
      .or(`user_id.is.null,user_id.eq.${userId}`)
      .order('nombre');

    if (error) throw error;
    return data ?? [];
  }

  async getEquipmentTypeById(id: string): Promise<EquipmentType> {
    const userId = await this.requireUserId();
    const { data, error } = await this.supabase.client
      .from('tipos_equipo')
      .select('id,nombre,imagen_url,user_id,clasificacion_riesgo,frecuencia_mantenimiento_meses')
      .eq('user_id', userId)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as EquipmentType;
  }

  async uploadImage(file: File): Promise<string> {
    return this.equipmentImageService.upload(file, 'types');
  }

  async removeUploadedImage(publicUrl: string): Promise<void> {
    return this.equipmentImageService.remove(publicUrl);
  }

  async createEquipmentType(payload: EquipmentTypePayload): Promise<EquipmentType> {
    const userId = await this.requireUserId();
    const nombre = payload.nombre.trim();
    const frecuencia = Number(payload.frecuencia_mantenimiento_meses);
    if (!nombre) throw new Error('El nombre del tipo de equipo es obligatorio.');
    if (!['I', 'IIa', 'IIb', 'III'].includes(payload.clasificacion_riesgo)) {
      throw new Error('Selecciona una clasificación de riesgo válida.');
    }
    if (!Number.isInteger(frecuencia) || frecuencia < 1) {
      throw new Error('La frecuencia de mantenimiento debe ser un número entero mayor que cero.');
    }

    const { data, error } = await this.supabase.client
      .from('tipos_equipo')
      .insert({
        nombre,
        clasificacion_riesgo: payload.clasificacion_riesgo,
        frecuencia_mantenimiento_meses: frecuencia,
        imagen_url: payload.imagen_url ?? null,
        user_id: userId,
      })
      .select('id,nombre,imagen_url,user_id,clasificacion_riesgo,frecuencia_mantenimiento_meses')
      .single();

    if (error) throw error;
    return data as EquipmentType;
  }

  async updateEquipmentType(id: string, payload: EquipmentTypePayload): Promise<EquipmentType> {
    const userId = await this.requireUserId();
    const nombre = payload.nombre.trim();
    const frecuencia = Number(payload.frecuencia_mantenimiento_meses);
    if (!nombre) throw new Error('El nombre del tipo de equipo es obligatorio.');
    if (!['I', 'IIa', 'IIb', 'III'].includes(payload.clasificacion_riesgo)) {
      throw new Error('Selecciona una clasificación de riesgo válida.');
    }
    if (!Number.isInteger(frecuencia) || frecuencia < 1) {
      throw new Error('La frecuencia de mantenimiento debe ser un número entero mayor que cero.');
    }

    const { data, error } = await this.supabase.client
      .from('tipos_equipo')
      .update({
        nombre,
        clasificacion_riesgo: payload.clasificacion_riesgo,
        frecuencia_mantenimiento_meses: frecuencia,
        ...(payload.imagen_url !== undefined ? { imagen_url: payload.imagen_url } : {}),
      })
      .eq('user_id', userId)
      .eq('id', id)
      .select('id,nombre,imagen_url,user_id,clasificacion_riesgo,frecuencia_mantenimiento_meses')
      .single();

    if (error) throw error;
    return data as EquipmentType;
  }

  private async requireUserId(): Promise<string> {
    const { data, error } = await this.supabase.client.auth.getUser();
    if (error) throw error;
    if (!data.user) throw new Error('Debes iniciar sesión para gestionar tipos de equipo.');
    return data.user.id;
  }
}
