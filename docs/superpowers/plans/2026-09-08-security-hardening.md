# Security Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden the public inquiry and notification flow without changing its independently updated contact/address model.

**Architecture:** Request controls live at the route and security-helper boundaries; browser headers live in the Next configuration; storage/RPC hardening is represented by a forward-only local SQL migration. SMTP stays at-least-once but emits deterministic message identifiers for retry recognition.

**Tech Stack:** Next.js 16, TypeScript, Vitest, Playwright, Supabase SQL migrations, Nodemailer, pnpm.

**Spec:** `docs/superpowers/specs/2026-09-08-security-hardening-design.md`

## Global Constraints

- Do not modify the README or the email/phone/CEP/address data model.
- Do not read, print, create, or commit secret values.
- Do not run a remote migration, deploy, push, merge, or modify Vercel/Supabase/Gmail settings.
- Keep private API responses `no-store` and free of lead data.
- Every behavior change begins with a focused failing test.

---

### Task 1: Bound the inquiry request and redact provider logs

**Files:**
- Modify: `src/app/api/inquiries/route.ts`
- Modify: `src/test/unit/inquiry-api.test.ts`

**Interfaces:**
- Consumes: `Request.headers`, `Request.formData()`, `createInquiryPostHandler()` dependencies.
- Produces: a `415` response for non-multipart requests, a `413` response for an oversized declared request, and log events containing only the fixed stage.

- [ ] **Step 1: Write failing tests**

```ts
it('rejects a non-multipart inquiry before parsing its body', async () => {
  const response = await post(new Request('https://damazio.example/api/inquiries', {
    method: 'POST', headers: { origin: 'https://damazio.example', 'content-type': 'application/json' }, body: '{}',
  }));
  expect(response.status).toBe(415);
});

it('rejects a declared body above the aggregate attachment budget', async () => {
  const response = await post(requestWithHeaders({ 'content-length': String(16 * 1024 * 1024 + 1) }));
  expect(response.status).toBe(413);
});

it('does not log a provider error message', async () => {
  const report = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  await postWithFailingDependency(new Error('untrusted diagnostic text'));
  expect(report).toHaveBeenCalledWith('inquiry_submission_failed', { stage: 'load_product' });
});
```

- [ ] **Step 2: Run the focused tests and confirm they fail for the missing protections.**

Run: `pnpm vitest run src/test/unit/inquiry-api.test.ts`

- [ ] **Step 3: Implement the minimal request boundary.**

```ts
const MAX_INQUIRY_BODY_BYTES = 16 * 1024 * 1024;

function hasMultipartContentType(request: Request): boolean {
  return request.headers.get('content-type')?.toLowerCase().startsWith('multipart/form-data;') ?? false;
}

function declaredBodyIsTooLarge(request: Request): boolean {
  const size = Number(request.headers.get('content-length'));
  return Number.isSafeInteger(size) && size > MAX_INQUIRY_BODY_BYTES;
}
```

Extend `errorResponse` to accept `415`, reject before `formData()`, and replace all diagnostic details in the final catch with `{ stage }`.

- [ ] **Step 4: Run focused tests and confirm they pass.**

Run: `pnpm vitest run src/test/unit/inquiry-api.test.ts`

### Task 2: Use a trusted Vercel client IP while retaining a safe fallback

**Files:**
- Modify: `src/lib/security.ts`
- Modify: `src/test/unit/inquiry-security.test.ts`

**Interfaces:**
- Consumes: `requestClientKey(request, acceptsProxyHeaders)`.
- Produces: a normalized `x-vercel-forwarded-for` IP when proxy headers are explicitly trusted, otherwise `anonymous`.

- [ ] **Step 1: Write a failing regression test.**

```ts
it('prefers Vercel’s protected client IP header when proxy headers are trusted', () => {
  const request = new Request('https://damazio.example/api/inquiries', {
    headers: { 'x-vercel-forwarded-for': '203.0.113.10', 'x-forwarded-for': '198.51.100.4' },
  });
  expect(requestClientKey(request, true)).toBe('203.0.113.10');
});
```

- [ ] **Step 2: Run the focused test and confirm it fails.**

Run: `pnpm vitest run src/test/unit/inquiry-security.test.ts`

- [ ] **Step 3: Implement header precedence and strict IP validation.**

Read `x-vercel-forwarded-for` first only when `acceptsProxyHeaders` is true, then fall back to the first `x-forwarded-for` value. Preserve the existing IP syntax validation and `anonymous` fallback.

- [ ] **Step 4: Run focused tests and confirm they pass.**

Run: `pnpm vitest run src/test/unit/inquiry-security.test.ts`

### Task 3: Add browser security headers and secret-file ignore coverage

**Files:**
- Modify: `next.config.ts`
- Modify: `.gitignore`
- Modify: `src/test/e2e/seo-and-errors.spec.ts`

**Interfaces:**
- Consumes: Next.js `headers()` configuration.
- Produces: security headers for public pages and ignores any real `.env*` file while retaining `.env.example`.

- [ ] **Step 1: Write a failing E2E response-header test.**

```ts
test('public pages emit anti-framing, MIME, referrer, permissions, and CSP headers', async ({ request }) => {
  const response = await request.get('/');
  expect(response.headers()['x-content-type-options']).toBe('nosniff');
  expect(response.headers()['x-frame-options']).toBe('DENY');
  expect(response.headers()['content-security-policy']).toContain("default-src 'self'");
});
```

- [ ] **Step 2: Run the focused E2E test and confirm it fails.**

Run: `pnpm exec playwright test src/test/e2e/seo-and-errors.spec.ts`

- [ ] **Step 3: Implement static security headers.**

Add `async headers()` to `next.config.ts` for `/:path*`, including HSTS, CSP with `default-src 'self'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `frame-ancestors 'none'`, `img-src 'self' data: blob:`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, a strict-origin referrer policy, disabled unused browser permissions, `Cross-Origin-Opener-Policy: same-origin`, and `Cross-Origin-Resource-Policy: same-origin`.

Change `.gitignore` to ignore `.env*` and immediately re-include `.env.example`. Verify with `git check-ignore -q .env.production` and `git check-ignore -q .env.example` (the latter must return false).

- [ ] **Step 4: Run the focused E2E test and ignore-rule checks.**

Run: `pnpm exec playwright test src/test/e2e/seo-and-errors.spec.ts`

Run: `git check-ignore -q .env.production; if ($LASTEXITCODE -ne 0) { exit 1 }; git check-ignore -q .env.example; if ($LASTEXITCODE -eq 0) { exit 1 }`

### Task 4: Harden local Supabase definitions and SMTP retry identity

**Files:**
- Create: `supabase/migrations/0008_security_hardening.sql`
- Modify: `src/features/inquiries/lead-email.ts`
- Modify: `src/test/unit/lead-email.test.ts`

**Interfaces:**
- Consumes: queued notification recipient kind and request code.
- Produces: a stable `messageId` for each notification; a migration that updates only future local/approved database executions.

- [ ] **Step 1: Write a failing deterministic Message-ID test.**

```ts
it('uses one stable message identifier for retries of the same queued notification', () => {
  const first = buildLeadEmail(atelierNotification, config);
  const retry = buildLeadEmail(atelierNotification, config);
  expect(first.messageId).toBe(retry.messageId);
  expect(first.messageId).toMatch(/^<atelier-[a-z0-9]+@damazio-atelier\.invalid>$/);
});
```

- [ ] **Step 2: Run the focused test and confirm it fails.**

Run: `pnpm vitest run src/test/unit/lead-email.test.ts`

- [ ] **Step 3: Implement the message identifier and write the local migration.**

Create a helper that builds `<${recipientKind}-${requestCode.toLowerCase()}@damazio-atelier.invalid>` only after the existing payload parser has validated both fields, and include it in each `buildLeadEmail` return object.

In `0008_security_hardening.sql`, update `storage.buckets` for `inquiry-references` with `public = false`, a 5 MiB file limit, and JPEG/PNG/WebP allowed MIME types. Recreate every currently privileged function: `create_inquiry_with_contact_details`, `claim_inquiry_email_notifications`, `mark_inquiry_email_notification_sent`, and `reschedule_inquiry_email_notification`. Each must use `security definer set search_path = ''`, fully qualified `public` relations, `revoke execute ... from public`, explicit service-role grants, and default-privilege revocations for future public-schema functions. Do not invoke Supabase CLI or any remote connection.

- [ ] **Step 4: Run focused tests and inspect the migration without executing it.**

Run: `pnpm vitest run src/test/unit/lead-email.test.ts`

Run: `rg -n "file_size_limit|allowed_mime_types|search_path = ''|revoke execute|grant execute" supabase/migrations/0008_security_hardening.sql`

### Task 5: Upgrade the vulnerable dependency and verify the full system

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`

**Interfaces:**
- Consumes: `@supabase/supabase-js` package resolution.
- Produces: a lockfile resolving `@supabase/auth-js` at or above `2.70.0` without requiring Node newer than the project's `>=20.9.0` engine.

- [ ] **Step 1: Upgrade only the Supabase package dependency to the newest release compatible with Node 20.9+.**

Run: `pnpm up @supabase/supabase-js@2.109.0`

- [ ] **Step 2: Verify the resolved security floor.**

Run: `pnpm why @supabase/auth-js`

Run: `pnpm audit --json`

Expected: no advisory for `@supabase/auth-js` version `<= 2.69.1`.
The selected package must report a Node engine compatible with `>=20.9.0`.

- [ ] **Step 3: Run the complete verification suite.**

Run: `pnpm test`

Run: `pnpm lint`

Run: `pnpm build`

Run: `pnpm e2e`

- [ ] **Step 4: Review the diff and document manual remote checks.**

Run: `git diff --check`

Run: `git status --short`

Report that the migration is local and unapplied, plus the required Vercel Firewall rate limit and Supabase dashboard RLS/storage verification.
