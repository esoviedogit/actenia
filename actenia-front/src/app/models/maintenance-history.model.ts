import type { MaintenanceMonth } from './maintenance-month.model';
import type { TipoMantenimiento } from './tipo-mantenimiento.model';

export type MaintenanceTypeRelation =
  | Pick<TipoMantenimiento, 'id' | 'nombre'>
  | Pick<TipoMantenimiento, 'id' | 'nombre'>[]
  | null;

export interface MaintenanceEquipmentRelation {
  id: string;
  nombre: string;
  numero_inventario: string;
}

export type MaintenanceEquipmentRelationResult =
  | MaintenanceEquipmentRelation
  | MaintenanceEquipmentRelation[]
  | null;

export interface MaintenanceExecution {
  id: string;
  equipo_id: string;
  user_id: string;
  tipo_mantenimiento_id: string | null;
  tipo_mantenimiento: MaintenanceTypeRelation;
  equipo: MaintenanceEquipmentRelation | null;
  fecha: string;
  descripcion: string;
  observaciones: string | null;
  estado: string;
  mes_programado: MaintenanceMonth;
  anio: number;
  costo: number | null;
  proxima_fecha: string | null;
}

export interface MaintenanceExecutionPayload {
  equipo_id: string;
  tipo_mantenimiento_id: string;
  fecha: string;
  descripcion?: string;
  observaciones?: string;
  estado?: string;
  mes_programado: MaintenanceMonth;
  anio: number;
  costo?: number | null;
  proxima_fecha?: string | null;
}

export interface MaintenanceHistoryRecord extends MaintenanceExecution {
  responsable: string;
}
