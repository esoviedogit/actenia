export type EquipmentStatus = 'EN USO' | 'EN MANTENIMIENTO' | 'DE BAJA';
export type InvimaRiskClassification = 'I' | 'IIa' | 'IIb' | 'III';

export interface ElectricalSpecifications {
  voltaje: string;
  frecuencia: string;
  potencia: string;
  amperaje: string;
  corriente: string;
  usa_bateria: boolean;
  usa_adaptador: boolean;
  tipo_bateria?: string | null;
  voltaje_adaptador?: string | null;
  amperaje_adaptador?: string | null;
}

export interface EquipmentDimensions {
  peso_kg: number | null;
  largo_mm: number | null;
  ancho_mm: number | null;
  alto_mm: number | null;
}

export interface EquipmentRecord {
  id: string;
  user_id: string;
  nombre: string;
  numero_inventario: string;
  tipo_equipo_id: string | null;
  marca: string | null;
  modelo: string | null;
  serial: string | null;
  fabricante: string | null;
  fecha_adquisicion: string | null;
  garantia_periodo: string | null;
  vida_util_anios: number | null;
  clasificacion_riesgo_invima: InvimaRiskClassification | null;
  registro_sanitario_invima: string | null;
  estado: EquipmentStatus;
  sede_id: string | null;
  consultorio_id: string | null;
  proveedor_id: string | null;
  especificaciones_electricas: ElectricalSpecifications | null;
  dimensiones: EquipmentDimensions | null;
  requiere_calibracion: boolean;
  frecuencia_calibracion: string | null;
  frecuencia_mantenimiento_meses: number | null;
  meses_programados?: string[];
  fecha_proximo_mantenimiento: string | null;
  fecha_proxima_calibracion: string | null;
  observaciones: string | null;
  manual_usuario_url: string | null;
  qr_code_url: string | null;
  imagen_url: string | null;
  created_at: string;
  sede?: {
    id: string;
    nombre: string;
    empresa: string | null;
    direccion: string | null;
    ciudad: string | null;
    telefono: string | null;
    codigo_habilitacion: string | null;
  } | null;
  ubicacion?: {
    id: string;
    nombre: string;
    piso: number | string | null;
    codigo_servicio: string | null;
  } | null;
  proveedor?: {
    id: string;
    nombre: string;
    direccion: string | null;
    telefono_fijo: string | null;
    telefono_celular: string | null;
    email: string | null;
    sitio_web: string | null;
  } | null;
  tipo_equipo?: {
    id: string;
    nombre: string;
    imagen_url?: string | null;
    clasificacion_riesgo: InvimaRiskClassification | null;
    frecuencia_mantenimiento_meses: number | null;
  } | null;
}

export interface EquipmentScheduleRecord {
  id: string;
  nombre: string;
  numero_inventario: string;
  fecha_adquisicion: string | null;
  meses_programados: string[] | null;
  sede: {
    id: string;
    nombre: string;
  } | null;
}

export interface EquipmentPayload {
  nombre: string;
  numero_inventario: string;
  tipo_equipo_id: string | null;
  marca: string | null;
  modelo: string | null;
  serial: string | null;
  fabricante: string | null;
  fecha_adquisicion: string | null;
  garantia_periodo: string | null;
  vida_util_anios: number | null;
  clasificacion_riesgo_invima: InvimaRiskClassification | null;
  registro_sanitario_invima: string | null;
  estado: EquipmentStatus;
  sede_id: string | null;
  consultorio_id: string | null;
  proveedor_id: string | null;
  especificaciones_electricas: ElectricalSpecifications;
  dimensiones: EquipmentDimensions;
  requiere_calibracion: boolean;
  frecuencia_calibracion: string | null;
  frecuencia_mantenimiento_meses: number | null;
  meses_programados?: string[];
  fecha_proximo_mantenimiento: string | null;
  fecha_proxima_calibracion: string | null;
  observaciones: string | null;
  manual_usuario_url: string | null;
  qr_code_url: string | null;
  imagen_url: string | null;
}

export interface Equipment {
  id?: string;
  nombre: string;
  marca?: string | null;
  modelo?: string | null;
  serie?: string | null;
  numero_inventario?: string;
  sede_id: string;
  ubicacion_id: string;
  tipo_id: string;
  estado?: EquipmentStatus;
  fecha_mantenimiento?: string | null;
  fecha_calibracion?: string | null;
  user_id?: string;
  fabricante?: string | null;
  fecha_adquisicion?: string | null;
  garantia_periodo?: string | null;
  vida_util_anios?: number | null;
  clasificacion_riesgo_invima?: InvimaRiskClassification | null;
  registro_sanitario_invima?: string | null;
  proveedor_id?: string | null;
  especificaciones_electricas?: ElectricalSpecifications;
  dimensiones?: EquipmentDimensions;
  requiere_calibracion?: boolean;
  frecuencia_calibracion?: string | null;
  frecuencia_mantenimiento_meses?: number | null;
  meses_programados?: string[];
  observaciones?: string | null;
  manual_usuario_url?: string | null;
  qr_code_url?: string | null;
  imagen_url?: string | null;
}

export interface EquipmentCatalogs {
  proveedores: Array<{
    id: string;
    nombre: string;
    direccion: string | null;
    telefono_fijo: string | null;
    telefono_celular: string | null;
    email: string | null;
    sitio_web: string | null;
  }>;
}
