import { UbicacionService } from './ubicacion.service';
import { SupabaseService } from './supabase-services/supabase/supabase';

describe('UbicacionService', () => {
  function createSupabaseMock(response: { data: unknown; error: null }) {
    const query = {
      select: vi.fn(() => query),
      insert: vi.fn(() => query),
      update: vi.fn(() => query),
      delete: vi.fn(() => query),
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

    return { supabase, query };
  }

  it('reads the consultorios table as locations and filters by user and sede', async () => {
    const location = {
      id: 'area-1',
      nombre: 'Terapia Física',
      sede_id: 'sede-1',
      sede: { nombre: 'Sede Principal' },
    };
    const { supabase, query } = createSupabaseMock({
      data: [location],
      error: null,
    });
    const service = new UbicacionService(supabase);

    await expect(service.getUbicacionesBySede('sede-1')).resolves.toEqual([location]);
    expect(supabase.client.from).toHaveBeenCalledWith('consultorios');
    expect(query.select).toHaveBeenCalledWith('*, sede:sedes(nombre)');
    expect(query.eq).toHaveBeenNthCalledWith(1, 'user_id', 'user-123');
    expect(query.eq).toHaveBeenNthCalledWith(2, 'sede_id', 'sede-1');
  });

  it('assigns the authenticated owner on creation and scopes updates and deletes', async () => {
    const location = {
      id: 'area-1',
      nombre: 'Quirófano 2',
      sede_id: 'sede-1',
      user_id: 'user-123',
    };
    const { supabase, query } = createSupabaseMock({
      data: location,
      error: null,
    });
    const service = new UbicacionService(supabase);

    await service.createUbicacion({
      nombre: ' Quirófano 2 ',
      sede_id: 'sede-1',
      user_id: 'another-user',
    });
    expect(query.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        nombre: 'Quirófano 2',
        sede_id: 'sede-1',
        user_id: 'user-123',
      }),
    );

    await service.updateUbicacion('area-1', { nombre: 'Quirófano principal' });
    expect(query.update).toHaveBeenCalledWith({ nombre: 'Quirófano principal' });
    expect(query.eq).toHaveBeenCalledWith('user_id', 'user-123');

    await service.deleteUbicacion('area-1');
    expect(query.delete).toHaveBeenCalled();
  });
});
