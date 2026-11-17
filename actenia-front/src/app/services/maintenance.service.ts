import { Injectable } from '@angular/core';
import type { User } from '@supabase/supabase-js';
import type {
  MaintenanceExecution,
  MaintenanceEquipmentRelationResult,
  MaintenanceExecutionPayload,
  MaintenanceHistoryRecord,
} from '../models/maintenance-history.model';
import { MAINTENANCE_MONTHS } from '../models/maintenance-month.model';
import type { MaintenanceMonth } from '../models/maintenance-month.model';
import { SupabaseService } from './supabase-services/supabase/supabase';

const MAINTENANCE_COLUMNS =
  'id, equipo_id, user_id, tipo_mantenimiento_id, tipo_mantenimiento:tipos_mantenimiento_maestro(id, nombre), equipo:equipos(id, nombre, numero_inventario), fecha, descripcion, observaciones, estado, mes_programado, anio, costo, proxima_fecha';

interface MaintenanceExecutionResponse extends Omit<MaintenanceExecution, 'equipo'> {
  equipo: MaintenanceEquipmentRelationResult;
}

@Injectable({ providedIn: 'root' })
export class MaintenanceService {
  constructor(private readonly supabase: SupabaseService) {}

  async listForYear(year: number): Promise<MaintenanceExecution[]> {
    this.validateYear(year);
    const userId = await this.requireUserId();
    const { data, error } = await this.supabase.client
      .from('mantenimientos_equipos')
      .select(MAINTENANCE_COLUMNS)
      .eq('user_id', userId)
      .gte('fecha', `${year}-01-01`)
      .lte('fecha', `${year}-12-31`)
      .order('fecha', { ascending: false });

    if (error) throw error;
    return ((data ?? []) as unknown as MaintenanceExecutionResponse[]).map((record) =>
      this.normalizeExecution(record),
    );
  }

  async listGlobal(): Promise<MaintenanceHistoryRecord[]> {
    const user = await this.requireUser();
    const { data, error } = await this.supabase.client
      .from('mantenimientos_equipos')
      .select(MAINTENANCE_COLUMNS)
      .eq('user_id', user.id)
      .order('fecha', { ascending: false });

    if (error) throw error;

    const records = ((data ?? []) as unknown as MaintenanceExecutionResponse[]).map((record) =>
      this.normalizeExecution(record),
    );
    const responsable = this.userLabel(user);
    return records.map((record) => ({ ...record, responsable }));
  }

  async recordExecution(payload: MaintenanceExecutionPayload): Promise<MaintenanceExecution> {
    const userId = await this.requireUserId();
    this.validateExecutionPayload(payload);

    const { data, error } = await this.supabase.client
      .from('mantenimientos_equipos')
      .insert({
        equipo_id: payload.equipo_id,
        tipo_mantenimiento_id: payload.tipo_mantenimiento_id,
        fecha: payload.fecha,
        descripcion: payload.descripcion?.trim() ?? payload.observaciones?.trim() ?? '',
        observaciones: payload.observaciones?.trim() ?? '',
        estado: payload.estado ?? 'Realizado',
        mes_programado: payload.mes_programado,
        anio: payload.anio,
        costo: payload.costo ?? null,
        proxima_fecha: payload.proxima_fecha ?? null,
        user_id: userId,
      })
      .select(MAINTENANCE_COLUMNS)
      .single();

    if (error) throw error;
    return this.normalizeExecution(data as unknown as MaintenanceExecutionResponse);
  }

  async updateExecution(
    id: string,
    payload: MaintenanceExecutionPayload,
  ): Promise<MaintenanceExecution> {
    const userId = await this.requireUserId();
    if (!id.trim()) throw new Error('El registro de mantenimiento no es válido.');
    this.validateExecutionPayload(payload);

    const { data, error } = await this.supabase.client
      .from('mantenimientos_equipos')
      .update({
        equipo_id: payload.equipo_id,
        tipo_mantenimiento_id: payload.tipo_mantenimiento_id,
        fecha: payload.fecha,
        descripcion: payload.descripcion?.trim() ?? payload.observaciones?.trim() ?? '',
        observaciones: payload.observaciones?.trim() ?? '',
        estado: payload.estado ?? 'Realizado',
        mes_programado: payload.mes_programado,
        anio: payload.anio,
        costo: payload.costo ?? null,
        proxima_fecha: payload.proxima_fecha ?? null,
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select(MAINTENANCE_COLUMNS)
      .single();

    if (error) throw error;
    return this.normalizeExecution(data as unknown as MaintenanceExecutionResponse);
  }

  async deleteExecution(id: string): Promise<void> {
    const userId = await this.requireUserId();
    if (!id.trim()) throw new Error('El registro de mantenimiento no es válido.');
    const { error } = await this.supabase.client
      .from('mantenimientos_equipos')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  }

  private async requireUserId(): Promise<string> {
    return (await this.requireUser()).id;
  }

  private async requireUser() {
    const { data, error } = await this.supabase.client.auth.getUser();
    if (error) throw error;
    if (!data.user) throw new Error('Debes iniciar sesión para gestionar el cronograma.');
    return data.user;
  }

  private userLabel(user: User): string {
    const metadata = user.user_metadata;
    const metadataName = [metadata['full_name'], metadata['name']].find(
      (value): value is string => typeof value === 'string' && value.trim().length > 0,
    );
    return metadataName?.trim() || user.email || user.id;
  }

  private normalizeExecution(record: MaintenanceExecutionResponse): MaintenanceExecution {
    const equipment = Array.isArray(record.equipo) ? record.equipo[0] ?? null : record.equipo;
    return { ...record, equipo: equipment };
  }

  private validateExecutionPayload(payload: MaintenanceExecutionPayload): void {
    if (!payload.equipo_id) throw new Error('Selecciona el equipo del mantenimiento.');
    if (!payload.fecha) throw new Error('La fecha de ejecución es obligatoria.');
    if (!payload.tipo_mantenimiento_id.trim()) {
      throw new Error('Selecciona un tipo de mantenimiento válido.');
    }
    if (!this.isMaintenanceMonth(payload.mes_programado)) {
      throw new Error('Selecciona un mes programado válido.');
    }
    this.validateYear(payload.anio);
    this.validateExecutionDate(payload.fecha, payload.mes_programado, payload.anio);
  }

  private validateYear(year: number): void {
    if (!Number.isInteger(year) || year < 1900 || year > 9999) {
      throw new Error('Selecciona un año válido.');
    }
  }

  private isMaintenanceMonth(month: string): month is MaintenanceMonth {
    return MAINTENANCE_MONTHS.some((option) => option.value === month);
  }

  private validateExecutionDate(date: string, month: MaintenanceMonth, year: number): void {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
    if (!match) throw new Error('La fecha de ejecución no es válida.');

    const [, dateYear, dateMonth, dateDay] = match;
    const parsedDate = new Date(Date.UTC(Number(dateYear), Number(dateMonth) - 1, Number(dateDay)));
    if (
      parsedDate.getUTCFullYear() !== Number(dateYear) ||
      parsedDate.getUTCMonth() + 1 !== Number(dateMonth) ||
      parsedDate.getUTCDate() !== Number(dateDay)
    ) {
      throw new Error('La fecha de ejecución no es válida.');
    }

    const scheduledMonth = MAINTENANCE_MONTHS.findIndex((option) => option.value === month) + 1;
    if (Number(dateYear) !== year || Number(dateMonth) !== scheduledMonth) {
      throw new Error('La fecha debe coincidir con el mes y año del cronograma.');
    }
  }
}
