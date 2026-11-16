export type EquipmentMaintenanceType =
  'MANTENIMIENTO_PREVENTIVO' | 'MANTENIMIENTO_CORRECTIVO' | 'CALIBRACION';

export interface EquipmentMaintenance {
  id: string;
  equipo_id: string;
  user_id: string;
  tipo: EquipmentMaintenanceType;
  fecha: string;
  descripcion: string;
  proveedor_id: string | null;
  costo: number | null;
  proxima_fecha: string | null;
  created_at: string;
  proveedor?: { id: string; nombre: string } | null;
}

export interface EquipmentMaintenancePayload {
  equipo_id: string;
  tipo: EquipmentMaintenanceType;
  fecha: string;
  descripcion: string;
  proveedor_id?: string | null;
  costo?: number | null;
  proxima_fecha?: string | null;
}
