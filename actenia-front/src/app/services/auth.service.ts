import { Injectable, signal } from '@angular/core';
import type { Session, User } from '@supabase/supabase-js';
import { SupabaseService } from './supabase-services/supabase/supabase';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly session = signal<Session | null>(null);
  readonly loading = signal(true);
  readonly sessionReady: Promise<void>;

  constructor(private readonly supabase: SupabaseService) {
    this.supabase.client.auth.onAuthStateChange((_event, session) => {
      this.session.set(session);
      this.loading.set(false);
    });

    this.sessionReady = this.loadSession();
  }

  async login(email: string, password: string): Promise<User> {
    const { data, error } = await this.supabase.client.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) throw error;
    if (!data.user) throw new Error('Supabase no devolvió un usuario autenticado.');
    this.session.set(data.session);
    this.loading.set(false);
    return data.user;
  }

  async logout(): Promise<void> {
    const { error } = await this.supabase.client.auth.signOut();
    if (error) throw error;
    this.session.set(null);
  }

  async getCurrentUser(): Promise<User | null> {
    await this.sessionReady;
    const { data, error } = await this.supabase.client.auth.getUser();
    if (error) throw error;
    return data.user;
  }

  private async loadSession(): Promise<void> {
    try {
      const { data, error } = await this.supabase.client.auth.getSession();
      if (error) throw error;
      this.session.set(data.session);
    } finally {
      this.loading.set(false);
    }
  }
}
