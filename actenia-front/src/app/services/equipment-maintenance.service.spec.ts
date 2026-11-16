import { EquipmentMaintenanceService } from './equipment-maintenance.service';
import { SupabaseService } from './supabase-services/supabase/supabase';

describe('EquipmentMaintenanceService', () => {
  it('creates a maintenance entry using the authenticated owner', async () => {
    const query = {
      insert: vi.fn(),
      select: vi.fn(),
      single: vi.fn(),
    };
    query.insert.mockReturnValue(query);
    query.select.mockReturnValue(query);
    query.single.mockResolvedValue({
      data: { id: 'maintenance-1', equipo_id: 'asset-1', user_id: 'user-123' },
      error: null,
    });
    const supabase = {
      client: {
        auth: {
          getUser: vi.fn(() =>
            Promise.resolve({ data: { user: { id: 'user-123' } }, error: null }),
          ),
        },
        from: vi.fn(() => query),
      },
    } as unknown as SupabaseService;

    const service = new EquipmentMaintenanceService(supabase);
    await service.create({
      equipo_id: 'asset-1',
      tipo: 'MANTENIMIENTO_PREVENTIVO',
      fecha: '2026-11-11',
      descripcion: 'Revisión y limpieza',
      proxima_fecha: '2027-05-11',
      costo: 150000,
    });

    expect(supabase.client.from).toHaveBeenCalledWith('mantenimientos_equipos');
    expect(query.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        equipo_id: 'asset-1',
        user_id: 'user-123',
        descripcion: 'Revisión y limpieza',
        proxima_fecha: '2027-05-11',
        costo: 150000,
      }),
    );
  });
});
