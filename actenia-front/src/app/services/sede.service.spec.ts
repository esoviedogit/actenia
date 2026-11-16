import { SedeService } from './sede.service';
import { SupabaseService } from './supabase-services/supabase/supabase';

describe('SedeService', () => {
  function createSupabaseMock(response: { data: unknown; error: null }) {
    const query = {
      select: vi.fn(() => query),
      insert: vi.fn(() => query),
      update: vi.fn(() => query),
      eq: vi.fn(() => query),
      order: vi.fn(() => Promise.resolve(response)),
      single: vi.fn(() => Promise.resolve(response)),
    };
    const auth = {
      getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'user-123' } }, error: null })),
    };
    const supabase = {
      client: {
        auth,
        from: vi.fn(() => query),
      },
    } as unknown as SupabaseService;

    return { supabase, query, auth };
  }

  it('filters sede queries by the authenticated user', async () => {
    const sede = { id: 'sede-1', nombre: 'Sede Norte', user_id: 'user-123' };
    const { supabase, query } = createSupabaseMock({ data: [sede], error: null });
    const service = new SedeService(supabase);

    await expect(service.getSedes()).resolves.toEqual([sede]);
    expect(query.eq).toHaveBeenCalledWith('user_id', 'user-123');
    expect(query.order).toHaveBeenCalledWith('nombre');
  });

  it('assigns ownership from the session and ignores client-supplied owner ids', async () => {
    const sede = { id: 'sede-1', nombre: 'Sede Norte', user_id: 'user-123' };
    const { supabase, query } = createSupabaseMock({ data: sede, error: null });
    const service = new SedeService(supabase);

    await service.createSede({
      nombre: ' Sede Norte ',
      ciudad: ' Cali ',
      user_id: 'different-user',
    });

    expect(query.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        nombre: 'Sede Norte',
        ciudad: 'Cali',
        user_id: 'user-123',
      }),
    );
    expect(query.eq).not.toHaveBeenCalledWith('user_id', 'different-user');
  });

  it('scopes detail and updates to the current user without clearing omitted fields', async () => {
    const sede = { id: 'sede-1', nombre: 'Sede Centro', user_id: 'user-123' };
    const { supabase, query } = createSupabaseMock({ data: sede, error: null });
    const service = new SedeService(supabase);

    await service.getSedeById('sede-1');
    expect(query.eq).toHaveBeenNthCalledWith(1, 'user_id', 'user-123');
    expect(query.eq).toHaveBeenNthCalledWith(2, 'id', 'sede-1');

    await service.updateSede('sede-1', { nombre: ' Sede Centro ' });
    expect(query.update).toHaveBeenCalledWith({ nombre: 'Sede Centro' });
    expect(query.eq).toHaveBeenNthCalledWith(3, 'user_id', 'user-123');
    expect(query.eq).toHaveBeenNthCalledWith(4, 'id', 'sede-1');
  });
});
