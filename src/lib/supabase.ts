import { createClient, User } from '@supabase/supabase-js';
import { isBettingOpen } from '../constants/elections';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
const rawAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  '';

export const SUPABASE_URL = rawUrl.trim();
export const SUPABASE_ANON_KEY = rawAnonKey.trim();

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const supabase = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

export async function signInWithGoogle(): Promise<void> {
  const redirectUrl = `${window.location.origin}${window.location.pathname}`;
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
    },
  });
  if (error) {
    throw error;
  }
}

export async function signOutUser(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw error;
  }
}

/**
 * Sincroniza de forma defensiva el perfil del usuario en `public.profiles`
 * (además del trigger automático en `auth.users`).
 */
export async function syncUserProfile(user: User): Promise<void> {
  if (!isSupabaseConfigured || !isBettingOpen()) return;

  const meta = user.user_metadata || {};
  const fullName =
    meta.full_name ||
    meta.name ||
    (user.email ? user.email.split('@')[0] : 'Participante');
  const avatarUrl = meta.avatar_url || meta.picture || null;

  await supabase.from('profiles').upsert(
    {
      id: user.id,
      full_name: fullName,
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );
}
