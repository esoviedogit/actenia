import { AuthService } from './auth.service';
import { SupabaseService } from './supabase-services/supabase/supabase';

describe('AuthService', () => {
  it('loads the initial session and updates its signal on auth events', async () => {
    let onAuthChange: ((event: string, session: unknown) => void) | undefined;
    const initialSession = { access_token: 'initial-token' };
    const authApi = {
      onAuthStateChange: vi.fn((callback: (event: string, session: unknown) => void) => {
        onAuthChange = callback;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      }),
      getSession: vi.fn(() => Promise.resolve({ data: { session: initialSession }, error: null })),
      getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'user-1' } }, error: null })),
      signInWithPassword: vi.fn(() =>
        Promise.resolve({
          data: {
            user: { id: 'user-1' },
            session: { access_token: 'signed-in-token' },
          },
          error: null,
        }),
      ),
      signOut: vi.fn(() => Promise.resolve({ error: null })),
    };
    const supabase = {
      client: { auth: authApi },
    } as unknown as SupabaseService;
    const service = new AuthService(supabase);

    await service.sessionReady;
    expect(service.session()).toEqual(initialSession);

    const changedSession = { access_token: 'refreshed-token' };
    onAuthChange?.('TOKEN_REFRESHED', changedSession);
    expect(service.session()).toEqual(changedSession);
  });

  it('uses the password grant and clears the session on logout', async () => {
    const authApi = {
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'user-1' } }, error: null })),
      signInWithPassword: vi.fn(() =>
        Promise.resolve({
          data: {
            user: { id: 'user-1' },
            session: { access_token: 'token' },
          },
          error: null,
        }),
      ),
      signOut: vi.fn(() => Promise.resolve({ error: null })),
    };
    const supabase = {
      client: { auth: authApi },
    } as unknown as SupabaseService;
    const service = new AuthService(supabase);

    await service.login('  user@example.com ', 'password');
    expect(authApi.signInWithPassword).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'password',
    });
    expect(service.session()?.access_token).toBe('token');

    await service.logout();
    expect(service.session()).toBeNull();
  });
});
