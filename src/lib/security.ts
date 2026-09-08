type SecurityEnvironment = Record<string, string | undefined>;

function asOrigin(value: string): string | null {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

export function configuredInquiryOrigins(environment: SecurityEnvironment = process.env): string[] {
  const configured = environment.INQUIRY_ALLOWED_ORIGINS?.trim();
  const values = configured
    ? configured.split(',')
    : environment.NODE_ENV === 'production'
      ? []
      : [environment.NEXT_PUBLIC_SITE_URL ?? ''];

  return [...new Set(values.map((value) => asOrigin(value.trim())).filter((value): value is string => value !== null))];
}

export function trustProxyHeaders(environment: SecurityEnvironment = process.env): boolean {
  return environment.INQUIRY_TRUST_PROXY_HEADERS === 'true';
}

export function isTrustedOrigin(request: Request, allowedOrigins: readonly string[]): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  try {
    return allowedOrigins.includes(new URL(origin).origin);
  } catch {
    return false;
  }
}

export function requestClientKey(request: Request, acceptsProxyHeaders: boolean): string {
  if (!acceptsProxyHeaders) return 'anonymous';
  const address = request.headers.get('x-vercel-forwarded-for')?.trim()
    || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return address && /^[0-9a-f:.]{3,45}$/i.test(address) ? address : 'anonymous';
}
