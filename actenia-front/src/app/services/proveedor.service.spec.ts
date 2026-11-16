import { ProveedorService } from './proveedor.service';
import { SupabaseService } from './supabase-services/supabase/supabase';

describe('ProveedorService', () => {
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

    return { supabase, query };
  }

  it('lists only providers owned by the authenticated user', async () => {
    const provider = { id: 'provider-1', nombre: 'Proveedor Norte', user_id: 'user-123' };
    const { supabase, query } = createSupabaseMock({ data: [provider], error: null });
    const service = new ProveedorService(supabase);

    await expect(service.getProveedores()).resolves.toEqual([provider]);
    expect(supabase.client.from).toHaveBeenCalledWith('proveedores');
    expect(query.eq).toHaveBeenCalledWith('user_id', 'user-123');
    expect(query.order).toHaveBeenCalledWith('nombre');
  });

  it('creates a provider with the session owner and normalized optional fields', async () => {
    const provider = { id: 'provider-1', nombre: 'Proveedor Norte', user_id: 'user-123' };
    const { supabase, query } = createSupabaseMock({ data: provider, error: null });
    const service = new ProveedorService(supabase);

    await service.createProveedor({
      nombre: ' Proveedor Norte ',
      telefono_celular: ' 3001234567 ',
    });

    expect(query.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        nombre: 'Proveedor Norte',
        telefono_celular: '3001234567',
        email: null,
        user_id: 'user-123',
      }),
    );
  });
});
