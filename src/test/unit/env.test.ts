import { afterEach, describe, expect, it, vi } from 'vitest';
import { getServerSupabaseEnv } from '@/lib/env';

describe('getServerSupabaseEnv', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('recusa inicializar acesso privilegiado sem o segredo de serviço', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://atelier.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_example');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '');

    expect(() => getServerSupabaseEnv()).toThrow('SUPABASE_SERVICE_ROLE_KEY');
  });
});
