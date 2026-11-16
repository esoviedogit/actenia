import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private supabaseClient: SupabaseClient | null = null;

  get client(): SupabaseClient {
    if (!environment.supabaseUrl || !environment.supabaseAnonKey) {
      throw new Error(
        'Configura supabaseUrl y supabaseAnonKey en src/environments/environment.ts.',
      );
    }

    if (!this.supabaseClient) {
      this.supabaseClient = createClient(environment.supabaseUrl, environment.supabaseAnonKey);
    }
    return this.supabaseClient;
  }
}
