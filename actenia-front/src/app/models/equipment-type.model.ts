export type EquipmentRiskClassification = 'I' | 'IIa' | 'IIb' | 'III';

export interface EquipmentType {
  id: string;
  nombre: string;
  imagen_url?: string | null;
  user_id: string | null;
  clasificacion_riesgo: EquipmentRiskClassification | null;
  frecuencia_mantenimiento_meses: number | null;
}

export interface EquipmentTypePayload {
  nombre: string;
  clasificacion_riesgo: EquipmentRiskClassification;
  frecuencia_mantenimiento_meses: number;
  imagen_url?: string | null;
}
