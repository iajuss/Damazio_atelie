import 'server-only';

import { createClient } from '@supabase/supabase-js';
import { getServerSupabaseEnv } from '@/lib/env';

export function createServerSupabaseClient() {
  const env = getServerSupabaseEnv();

  return createClient(env.url, env.serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
