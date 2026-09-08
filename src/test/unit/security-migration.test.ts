import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(resolve(process.cwd(), 'supabase/migrations/0008_security_hardening.sql'), 'utf8');

describe('migração de endurecimento de segurança', () => {
  it('restringe o bucket privado e fixa o contexto das RPCs privilegiadas', () => {
    expect(migration).toContain('file_size_limit = 5242880');
    expect(migration).toMatch(/allowed_mime_types\s*=\s*array\['image\/jpeg', 'image\/png', 'image\/webp'\]::text\[\]/);
    for (const functionName of [
      'create_inquiry_with_contact_details',
      'claim_inquiry_email_notifications',
      'mark_inquiry_email_notification_sent',
      'reschedule_inquiry_email_notification',
    ]) {
      expect(migration).toMatch(new RegExp(`create or replace function public\\.${functionName}[\\s\\S]*?security definer\\s+set search_path = ''`, 'i'));
    }
    expect(migration).toContain('alter default privileges in schema public revoke execute on functions from public');
  });
});
