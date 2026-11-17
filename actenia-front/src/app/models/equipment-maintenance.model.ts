export type EquipmentMaintenanceType =
  'MANTENIMIENTO_PREVENTIVO' | 'MANTENIMIENTO_CORRECTIVO' | 'CALIBRACION';

export interface EquipmentMaintenance {
  id: string;
  equipo_id: string;
  user_id: string;
  tipo: EquipmentMaintenanceType;
  fecha: string;
  descripcion: string;
  costo: number | null;
  proxima_fecha: string | null;
  created_at: string;
}

export interface EquipmentMaintenancePayload {
  equipo_id: string;
  tipo: EquipmentMaintenanceType;
  fecha: string;
  descripcion: string;
  costo?: number | null;
  proxima_fecha?: string | null;
}
