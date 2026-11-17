export function isEquipmentAvailableInScheduleYear(
  acquisitionDate: string | null,
  scheduleYear: number,
): boolean {
  if (!acquisitionDate) return true;

  const acquisitionYear = Number(/^(\d{4})-/.exec(acquisitionDate)?.[1]);
  return !Number.isInteger(acquisitionYear) || acquisitionYear <= scheduleYear;
}

export interface MaintenanceDateParts {
  day: number;
  month: number;
  year: number;
}

export function getMaintenanceDateParts(date: string): MaintenanceDateParts | null {
  const value = date.trim();
  const isoDate = /^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/.exec(value);
  const localizedDate = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  const year = Number(isoDate?.[1] ?? localizedDate?.[3]);
  const month = Number(isoDate?.[2] ?? localizedDate?.[2]);
  const day = Number(isoDate?.[3] ?? localizedDate?.[1]);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;

  const parsedDate = new Date(Date.UTC(year, month - 1, day));
  if (
    parsedDate.getUTCFullYear() !== year ||
    parsedDate.getUTCMonth() + 1 !== month ||
    parsedDate.getUTCDate() !== day
  ) {
    return null;
  }

  return { day, month, year };
}

export function formatMaintenanceDate(date: string): string {
  const dateParts = getMaintenanceDateParts(date);
  if (!dateParts) return date;

  const day = String(dateParts.day).padStart(2, '0');
  const month = String(dateParts.month).padStart(2, '0');
  return `${day}/${month}/${dateParts.year}`;
}

export function maintenanceDateTime(date: string): string | null {
  const dateParts = getMaintenanceDateParts(date);
  if (!dateParts) return null;

  const month = String(dateParts.month).padStart(2, '0');
  const day = String(dateParts.day).padStart(2, '0');
  return `${dateParts.year}-${month}-${day}`;
}
