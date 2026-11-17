import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase-services/supabase/supabase';
import {
  Equipment,
  EquipmentCatalogs,
  EquipmentPayload,
  EquipmentRecord,
  EquipmentScheduleRecord,
} from '../models/equipment.model';
import { EquipmentImageService } from './equipment-image.service';

const EQUIPMENT_RELATIONS =
  '*, sede:sedes(id,nombre,empresa,direccion,ciudad,telefono,codigo_habilitacion), ubicacion:consultorios(id,nombre,piso,codigo_servicio), proveedor:proveedores(id,nombre,direccion,telefono_fijo,telefono_celular,email,sitio_web), tipo_equipo:tipos_equipo(id,nombre,imagen_url,clasificacion_riesgo,frecuencia_mantenimiento_meses)';

@Injectable({ providedIn: 'root' })
export class EquipmentService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly equipmentImageService: EquipmentImageService,
  ) {}

  async list(): Promise<EquipmentRecord[]> {
    const userId = await this.requireUserId();
    const { data, error } = await this.supabase.client
      .from('equipos')
      .select(EQUIPMENT_RELATIONS)
      .eq('user_id', userId)
      .order('numero_inventario');

    if (error) throw error;
    return (data ?? []) as unknown as EquipmentRecord[];
  }

  async listForSchedule(): Promise<EquipmentScheduleRecord[]> {
    const userId = await this.requireUserId();
    const { data, error } = await this.supabase.client
      .from('equipos')
      .select(
        'id,nombre,numero_inventario,fecha_adquisicion,meses_programados,sede:sedes(id,nombre)',
      )
      .eq('user_id', userId)
      .order('numero_inventario');

    if (error) throw error;
    return (data ?? []) as unknown as EquipmentScheduleRecord[];
  }

  async getById(id: string): Promise<EquipmentRecord> {
    const userId = await this.requireUserId();
    const { data, error } = await this.supabase.client
      .from('equipos')
      .select(EQUIPMENT_RELATIONS)
      .eq('user_id', userId)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as unknown as EquipmentRecord;
  }

  async create(payload: EquipmentPayload): Promise<EquipmentRecord> {
    const userId = await this.requireUserId();
    const { data, error } = await this.supabase.client
      .from('equipos')
      .insert({ ...payload, user_id: userId })
      .select(EQUIPMENT_RELATIONS)
      .single();

    if (error) throw error;
    return data as unknown as EquipmentRecord;
  }

  async createEquipment(equipment: Partial<Equipment>): Promise<EquipmentRecord> {
    const userId = await this.requireUserId();
    const numeroInventario = equipment.numero_inventario?.trim();
    const nombre = equipment.nombre?.trim();
    const sedeId = equipment.sede_id?.trim();
    const ubicacionId = equipment.ubicacion_id?.trim();
    const tipoId = equipment.tipo_id?.trim();
    if (!nombre || !numeroInventario || !sedeId || !ubicacionId || !tipoId) {
      throw new Error('Nombre, inventario, sede, ubicación y tipo de activo son obligatorios.');
    }

    const { data, error } = await this.supabase.client
      .from('equipos')
      .insert({
        nombre,
        numero_inventario: numeroInventario,
        tipo_equipo_id: tipoId,
        sede_id: sedeId,
        consultorio_id: ubicacionId,
        marca: equipment.marca?.trim() || null,
        modelo: equipment.modelo?.trim() || null,
        serial: equipment.serie?.trim() || null,
        fabricante: equipment.fabricante?.trim() || null,
        fecha_adquisicion: equipment.fecha_adquisicion || null,
        garantia_periodo: equipment.garantia_periodo?.trim() || null,
        vida_util_anios: equipment.vida_util_anios ?? null,
        clasificacion_riesgo_invima: equipment.clasificacion_riesgo_invima ?? null,
        registro_sanitario_invima: equipment.registro_sanitario_invima?.trim() || null,
        estado: equipment.estado ?? 'EN USO',
        proveedor_id: equipment.proveedor_id || null,
        especificaciones_electricas: equipment.especificaciones_electricas ?? undefined,
        dimensiones: equipment.dimensiones ?? undefined,
        requiere_calibracion: equipment.requiere_calibracion ?? false,
        frecuencia_calibracion: equipment.frecuencia_calibracion?.trim() || null,
        frecuencia_mantenimiento_meses: equipment.frecuencia_mantenimiento_meses ?? null,
        meses_programados: equipment.meses_programados ?? [],
        fecha_proximo_mantenimiento: equipment.fecha_mantenimiento || null,
        fecha_proxima_calibracion: equipment.fecha_calibracion || null,
        observaciones: equipment.observaciones?.trim() || null,
        manual_usuario_url: equipment.manual_usuario_url?.trim() || null,
        qr_code_url: equipment.qr_code_url?.trim() || null,
        imagen_url: equipment.imagen_url || null,
        user_id: userId,
      })
      .select(EQUIPMENT_RELATIONS)
      .single();

    if (error) throw error;
    return data as unknown as EquipmentRecord;
  }

  async update(id: string, payload: EquipmentPayload): Promise<EquipmentRecord> {
    const userId = await this.requireUserId();
    const { data, error } = await this.supabase.client
      .from('equipos')
      .update(payload)
      .eq('user_id', userId)
      .eq('id', id)
      .select(EQUIPMENT_RELATIONS)
      .single();

    if (error) throw error;
    return data as unknown as EquipmentRecord;
  }

  async updateFields(id: string, fields: Partial<EquipmentPayload>): Promise<EquipmentRecord> {
    const userId = await this.requireUserId();
    if (Object.keys(fields).length === 0) {
      throw new Error('No hay cambios para guardar.');
    }

    const { data, error } = await this.supabase.client
      .from('equipos')
      .update(fields)
      .eq('user_id', userId)
      .eq('id', id)
      .select(EQUIPMENT_RELATIONS)
      .single();

    if (error) throw error;
    return data as unknown as EquipmentRecord;
  }

  async delete(id: string): Promise<void> {
    const userId = await this.requireUserId();
    const { data: equipment, error: lookupError } = await this.supabase.client
      .from('equipos')
      .select('imagen_url')
      .eq('user_id', userId)
      .eq('id', id)
      .single();

    if (lookupError) throw lookupError;
    if (equipment.imagen_url) {
      await this.equipmentImageService.remove(equipment.imagen_url);
    }

    const { error } = await this.supabase.client
      .from('equipos')
      .delete()
      .eq('user_id', userId)
      .eq('id', id);

    if (error) throw error;
  }

  async getCatalogs(): Promise<EquipmentCatalogs> {
    const userId = await this.requireUserId();
    const { data, error } = await this.supabase.client
      .from('proveedores')
      .select('id,nombre,direccion,telefono_fijo,telefono_celular,email,sitio_web')
      .eq('user_id', userId)
      .order('nombre');

    if (error) throw error;
    return { proveedores: data ?? [] };
  }

  private async requireUserId(): Promise<string> {
    const { data, error } = await this.supabase.client.auth.getUser();
    if (error) throw error;
    if (!data.user) throw new Error('Debes iniciar sesión para gestionar equipos.');
    return data.user.id;
  }
}
