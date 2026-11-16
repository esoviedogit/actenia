import { getEquipmentAlert } from './equipment-alerts';

describe('getEquipmentAlert', () => {
  const today = new Date(2026, 4, 10);

  it('marks a past maintenance or calibration date as overdue', () => {
    expect(
      getEquipmentAlert(
        {
          fecha_proximo_mantenimiento: '2026-05-09',
          fecha_proxima_calibracion: null,
        },
        today,
      ).level,
    ).toBe('overdue');
  });

  it('marks dates within 30 days as upcoming', () => {
    expect(
      getEquipmentAlert(
        {
          fecha_proximo_mantenimiento: null,
          fecha_proxima_calibracion: '2026-06-09',
        },
        today,
      ).level,
    ).toBe('upcoming');
  });

  it('distinguishes clear and unscheduled equipment', () => {
    expect(
      getEquipmentAlert(
        {
          fecha_proximo_mantenimiento: '2026-07-01',
          fecha_proxima_calibracion: null,
        },
        today,
      ).level,
    ).toBe('clear');
    expect(
      getEquipmentAlert(
        {
          fecha_proximo_mantenimiento: null,
          fecha_proxima_calibracion: null,
        },
        today,
      ).level,
    ).toBe('unscheduled');
  });
});
