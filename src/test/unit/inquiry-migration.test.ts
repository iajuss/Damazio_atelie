import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(resolve(process.cwd(), 'supabase/migrations/0007_inquiry_contact_address_and_customer_confirmation.sql'), 'utf8');

describe('migração de contato e confirmação', () => {
  it('vincula o payload do cliente aos dados persistidos e mantém o contato legado igual ao e-mail', () => {
    expect(migration).toContain("p_contact <> p_email");
    expect(migration).toMatch(/p_customer_notification_payload\s*<>\s*jsonb_build_object\(\s*'requestCode',\s*p_request_code,\s*'name',\s*p_name,\s*'email',\s*p_email\s*\)/);
  });
});
