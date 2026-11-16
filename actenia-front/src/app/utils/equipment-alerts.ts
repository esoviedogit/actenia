import { EquipmentRecord } from '../models/equipment.model';

export type AlertLevel = 'overdue' | 'upcoming' | 'clear' | 'unscheduled';

export interface EquipmentAlert {
  level: AlertLevel;
  label: string;
  date: string | null;
}

const UPCOMING_WINDOW_DAYS = 30;

export function getEquipmentAlert(
  equipment: Pick<EquipmentRecord, 'fecha_proximo_mantenimiento' | 'fecha_proxima_calibracion'>,
  today = new Date(),
): EquipmentAlert {
  const scheduledDates = [
    equipment.fecha_proximo_mantenimiento,
    equipment.fecha_proxima_calibracion,
  ]
    .filter((date): date is string => Boolean(date))
    .map((date) => ({ date, timestamp: Date.parse(`${date}T00:00:00`) }))
    .filter(({ timestamp }) => Number.isFinite(timestamp))
    .sort((a, b) => a.timestamp - b.timestamp);

  const nextDate = scheduledDates[0];
  if (!nextDate) {
    return { level: 'unscheduled', label: 'Sin programar', date: null };
  }

  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const daysUntil = Math.ceil((nextDate.timestamp - todayDate.getTime()) / (24 * 60 * 60 * 1000));

  if (daysUntil < 0) {
    return { level: 'overdue', label: 'Vencido', date: nextDate.date };
  }
  if (daysUntil <= UPCOMING_WINDOW_DAYS) {
    return { level: 'upcoming', label: 'Próximo', date: nextDate.date };
  }
  return { level: 'clear', label: 'Al día', date: nextDate.date };
}
