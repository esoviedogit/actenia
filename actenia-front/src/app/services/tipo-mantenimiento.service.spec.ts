import { SupabaseService } from './supabase-services/supabase/supabase';
import { TipoMantenimientoService } from './tipo-mantenimiento.service';

describe('TipoMantenimientoService', () => {
  it('lists active types available to the authenticated user', async () => {
    const query = {
      select: vi.fn(),
      eq: vi.fn(),
      or: vi.fn(),
      order: vi.fn(),
    };
    query.select.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    query.or.mockReturnValue(query);
    query.order.mockResolvedValue({
      data: [
        {
          id: 'type-preventive',
          nombre: 'Preventivo',
          descripcion: null,
          activo: true,
          user_id: null,
        },
      ],
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

    await expect(new TipoMantenimientoService(supabase).getTiposMantenimiento()).resolves.toEqual([
      {
        id: 'type-preventive',
        nombre: 'Preventivo',
        descripcion: null,
        activo: true,
        user_id: null,
      },
    ]);

    expect(supabase.client.from).toHaveBeenCalledWith('tipos_mantenimiento_maestro');
    expect(query.eq).toHaveBeenCalledWith('activo', true);
    expect(query.or).toHaveBeenCalledWith('user_id.is.null,user_id.eq.user-123');
  });
});
