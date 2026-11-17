export const MAINTENANCE_FREQUENCIES = [
  { label: 'Mensual', months: 1 },
  { label: 'Bimestral', months: 2 },
  { label: 'Trimestral', months: 3 },
  { label: 'Cuatrimestral', months: 4 },
  { label: 'Semestral', months: 6 },
  { label: 'Anual', months: 12 },
] as const;

export function maintenanceFrequencyLabel(months: number | null | undefined): string {
  if (months === null || months === undefined) return 'No registrada';
  return (
    MAINTENANCE_FREQUENCIES.find((frequency) => frequency.months === months)?.label ??
    `${months} meses`
  );
}
