export const MAINTENANCE_MONTHS = [
  { value: 'ENERO', label: 'Enero' },
  { value: 'FEBRERO', label: 'Febrero' },
  { value: 'MARZO', label: 'Marzo' },
  { value: 'ABRIL', label: 'Abril' },
  { value: 'MAYO', label: 'Mayo' },
  { value: 'JUNIO', label: 'Junio' },
  { value: 'JULIO', label: 'Julio' },
  { value: 'AGOSTO', label: 'Agosto' },
  { value: 'SEPTIEMBRE', label: 'Septiembre' },
  { value: 'OCTUBRE', label: 'Octubre' },
  { value: 'NOVIEMBRE', label: 'Noviembre' },
  { value: 'DICIEMBRE', label: 'Diciembre' },
] as const;

export type MaintenanceMonth = (typeof MAINTENANCE_MONTHS)[number]['value'];

export function maintenanceMonthsLabel(months: readonly string[] | null | undefined): string {
  if (!months?.length) return 'Sin meses programados';
  return months
    .map((month) => MAINTENANCE_MONTHS.find((option) => option.value === month)?.label ?? month)
    .join(', ');
}
