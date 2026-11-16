import { EquipmentService } from './equipment.service';
import { SupabaseService } from './supabase-services/supabase/supabase';

describe('EquipmentService', () => {
  it('updates only the supplied fields for the authenticated owner', async () => {
    const query = {
      update: vi.fn(),
      eq: vi.fn(),
      select: vi.fn(),
      single: vi.fn(),
    };
    query.update.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    query.select.mockReturnValue(query);
    query.single.mockResolvedValue({
      data: { id: 'asset-1', estado: 'EN MANTENIMIENTO' },
      error: null,
    });

    const supabase = {
      client: {
        auth: {
          getUser: vi.fn(() =>
            Promise.resolve({
              data: { user: { id: 'user-123' } },
              error: null,
            }),
          ),
        },
        from: vi.fn(() => query),
      },
    } as unknown as SupabaseService;
    const service = new EquipmentService(supabase);

    await service.updateFields('asset-1', { estado: 'EN MANTENIMIENTO' });

    expect(query.update).toHaveBeenCalledWith({ estado: 'EN MANTENIMIENTO' });
    expect(query.eq).toHaveBeenNthCalledWith(1, 'user_id', 'user-123');
    expect(query.eq).toHaveBeenNthCalledWith(2, 'id', 'asset-1');
  });

  it('maps the form model to database columns and assigns the session owner', async () => {
    const query = {
      insert: vi.fn(),
      select: vi.fn(),
      single: vi.fn(),
    };
    query.insert.mockReturnValue(query);
    query.select.mockReturnValue(query);
    query.single.mockResolvedValue({
      data: { id: 'asset-1', nombre: 'Impresora recepción' },
      error: null,
    });

    const supabase = {
      client: {
        auth: {
          getUser: vi.fn(() =>
            Promise.resolve({
              data: { user: { id: 'user-123' } },
              error: null,
            }),
          ),
        },
        from: vi.fn(() => query),
      },
    } as unknown as SupabaseService;
    const service = new EquipmentService(supabase);

    await service.createEquipment({
      nombre: ' Impresora recepción ',
      numero_inventario: ' INV-10 ',
      sede_id: 'sede-1',
      ubicacion_id: 'area-1',
      tipo_id: 'type-1',
      serie: ' SN-10 ',
      user_id: 'untrusted-owner',
    });

    expect(supabase.client.from).toHaveBeenCalledWith('equipos');
    expect(query.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        nombre: 'Impresora recepción',
        numero_inventario: 'INV-10',
        sede_id: 'sede-1',
        consultorio_id: 'area-1',
        tipo_equipo_id: 'type-1',
        serial: 'SN-10',
        user_id: 'user-123',
      }),
    );
    expect(query.select).toHaveBeenCalledWith(expect.stringContaining('ubicacion:consultorios'));
  });
});
