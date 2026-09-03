type PublicSupabaseEnv = {
  url: string;
  publishableKey: string;
};

export type ServerSupabaseEnv = PublicSupabaseEnv & {
  serviceRoleKey: string;
};

function required(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Variável de ambiente obrigatória ausente: ${name}`);
  }

  return value;
}

export function getPublicSupabaseEnv(): PublicSupabaseEnv {
  return {
    url: required('NEXT_PUBLIC_SUPABASE_URL'),
    publishableKey: required('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'),
  };
}

export function getServerSupabaseEnv(): ServerSupabaseEnv {
  return {
    ...getPublicSupabaseEnv(),
    serviceRoleKey: required('SUPABASE_SERVICE_ROLE_KEY'),
  };
}
