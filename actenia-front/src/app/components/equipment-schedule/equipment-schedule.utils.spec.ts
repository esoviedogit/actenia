import {
  formatMaintenanceDate,
  getMaintenanceDateParts,
  isEquipmentAvailableInScheduleYear,
  maintenanceDateTime,
} from './equipment-schedule.utils';

describe('isEquipmentAvailableInScheduleYear', () => {
  it('includes equipment acquired by the selected year and excludes later acquisitions', () => {
    expect(isEquipmentAvailableInScheduleYear('2024-06-15', 2025)).toBe(true);
    expect(isEquipmentAvailableInScheduleYear('2025-01-01', 2025)).toBe(true);
    expect(isEquipmentAvailableInScheduleYear('2026-03-20', 2025)).toBe(false);
  });

  describe('getMaintenanceDateParts', () => {
    it('extracts month and year from ISO and day/month/year dates', () => {
      expect(getMaintenanceDateParts('2026-11-17')).toEqual({ day: 17, month: 11, year: 2026 });
      expect(getMaintenanceDateParts('17/11/2026')).toEqual({ day: 17, month: 11, year: 2026 });
    });

    it('rejects invalid dates', () => {
      expect(getMaintenanceDateParts('31/02/2026')).toBeNull();
      expect(getMaintenanceDateParts('not a date')).toBeNull();
    });

    it('formats the date consistently for display and the time element', () => {
      expect(formatMaintenanceDate('2026-11-17')).toBe('17/11/2026');
      expect(formatMaintenanceDate('17/11/2026')).toBe('17/11/2026');
      expect(maintenanceDateTime('17/11/2026')).toBe('2026-11-17');
    });
  });

  it('keeps equipment with no valid acquisition year visible', () => {
    expect(isEquipmentAvailableInScheduleYear(null, 2025)).toBe(true);
    expect(isEquipmentAvailableInScheduleYear('fecha inválida', 2025)).toBe(true);
  });
});
