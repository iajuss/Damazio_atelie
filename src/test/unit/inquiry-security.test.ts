import { describe, expect, it } from 'vitest';
import { createRateLimiter } from '@/lib/rate-limit';
import { configuredInquiryOrigins, requestClientKey } from '@/lib/security';

describe('fronteiras de segurança da solicitação', () => {
  it('falha fechadamente sem allowlist de origem em produção', () => {
    expect(configuredInquiryOrigins({ NODE_ENV: 'production' })).toEqual([]);
    expect(configuredInquiryOrigins({ NODE_ENV: 'production', INQUIRY_ALLOWED_ORIGINS: 'https://damazio.example, https://www.damazio.example' })).toEqual([
      'https://damazio.example', 'https://www.damazio.example',
    ]);
  });

  it('só usa x-forwarded-for quando o proxy foi explicitamente confiado', () => {
    const request = new Request('https://damazio.example/api/inquiries', { headers: { 'x-forwarded-for': '203.0.113.10, 10.0.0.1' } });
    expect(requestClientKey(request, false)).toBe('anonymous');
    expect(requestClientKey(request, true)).toBe('203.0.113.10');
  });

  it('limpa chaves expiradas e bloqueia novas chaves ao atingir o teto local', () => {
    const allow = createRateLimiter({ limit: 2, windowMs: 60_000, maxEntries: 1 });
    expect(allow('primeira', 0)).toBe(true);
    expect(allow('segunda', 1)).toBe(false);
    expect(allow('segunda', 60_001)).toBe(true);
  });
});
