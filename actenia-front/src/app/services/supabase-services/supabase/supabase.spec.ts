import { environment } from '../../../../environments/environment';
import { SupabaseService } from './supabase';

describe('SupabaseService', () => {
  it('creates a configured Supabase client', () => {
    environment.supabaseUrl = 'https://example.supabase.co';
    environment.supabaseAnonKey = 'test-publishable-key';

    const service = new SupabaseService();

    expect(service.client).toBeTruthy();
  });

  it('fails explicitly when project credentials are missing', () => {
    environment.supabaseUrl = '';
    environment.supabaseAnonKey = '';

    expect(() => new SupabaseService().client).toThrowError(/Configura supabaseUrl/);
  });
});
