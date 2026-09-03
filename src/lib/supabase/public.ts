import { createClient } from '@supabase/supabase-js';
import { getPublicSupabaseEnv } from '@/lib/env';

export function createPublicSupabaseClient() {
  const env = getPublicSupabaseEnv();

  return createClient(env.url, env.publishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
