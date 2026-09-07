# Entrega de Leads e Deploy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preservar cada solicitação como lead privado, notificá-la por Gmail SMTP e preparar a publicação segura na Vercel.

**Architecture:** A função transacional do Supabase grava solicitação, anexos e uma linha de caixa de saída. Depois da persistência, a API tenta o SMTP sem afetar a confirmação ao visitante. Um Route Handler interno, acionado por cron protegido, reprocessa linhas pendentes.

**Tech Stack:** Next.js 16, TypeScript, React 19, Supabase, Nodemailer, Vercel Cron, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-07-entrega-de-leads-e-deploy-design.md`

## Global Constraints

- Preserve trusted origin, honeypot, rate limit, validation and private Supabase storage.
- Use only server-side `GMAIL_SMTP_USER`, `GMAIL_SMTP_APP_PASSWORD`, `GMAIL_SMTP_FROM`, `LEAD_NOTIFICATION_TO`, `CRON_SECRET`; never commit values or use `NEXT_PUBLIC_`.
- Use `smtp.gmail.com`, TLS and a Google App Password. A SMTP error cannot discard an already-persisted lead.
- Protect recovery with a Bearer `CRON_SECRET`; never return a lead, payload or secret from an HTTP response.
- Use default Vercel Hobby cron `0 8 * * *` in UTC; document `*/5 * * * *` as a Vercel Pro-only replacement.
- Preview deployments leave Gmail variables empty and do not send customer notifications.

---

## File structure

- `supabase/migrations/0005_inquiry_email_notifications.sql`: private outbox and database functions.
- `src/features/inquiries/lead-email.ts`: server-only configuration and text-email builder.
- `src/features/inquiries/lead-notifications.ts`: claim, deliver and reschedule worker.
- `src/app/api/internal/lead-notifications/route.ts`: protected cron handler.
- `src/app/api/inquiries/route.ts`: immediate delivery attempt.
- `src/components/inquiries/InquiryForm.tsx`, `src/components/catalog/CustomRequestCard.tsx`, `src/styles/globals.css`: Direct action and centered card.
- `.env.example`, `README.md`, `docs/operations/launch-checklist.md`, `src/app/(site)/privacidade/page.tsx`, `vercel.json`: deploy and privacy configuration.

### Task 1: Persist an e-mail outbox atomically

**Files:**
- Create: `supabase/migrations/0005_inquiry_email_notifications.sql`
- Modify: `src/features/inquiries/service.ts`
- Test: `src/test/unit/inquiry-service.test.ts`

**Interfaces:**
- Consumes: validated `InquiryInput`, product and attachment metadata.
- Produces: current `InquiryResult` plus one private notification row.

- [ ] **Step 1: Write the failing service test**

Add:

```ts
expect(calls).toEqual([[ 'create_inquiry_with_answers', expect.objectContaining({
  p_notification_payload: expect.objectContaining({
    requestCode: 'AB12CD34EF56GH78IJ90',
    name: 'Ana', productName: 'Toalha bordada',
    attachments: [{ filename: 'referencia.png', mimeType: 'image/png', byteSize: 8 }],
  }),
}) ]]);
```

- [ ] **Step 2: Run the red test**

Run: `pnpm vitest run src/test/unit/inquiry-service.test.ts`

Expected: FAIL because the RPC has no notification payload.

- [ ] **Step 3: Add the SQL outbox and functions**

Create `inquiry_email_notifications` with: `id uuid primary key`, `inquiry_id uuid references public.inquiries(id) on delete cascade`, `payload jsonb not null`, `status text check (status in ('pending','sending','sent','failed')) default 'pending'`, `attempts integer default 0`, `next_attempt_at timestamptz default now()`, `locked_at`, `sent_at`, `last_error` and timestamps. Enable RLS with no public policies.

Replace `create_inquiry_with_answers` with its current validation/inserts plus `p_notification_payload jsonb`; insert the outbox row in the same transaction. Revoke public execute and grant only `service_role`.

Create these restricted RPCs:

```sql
claim_inquiry_email_notifications(p_limit integer, p_request_code text default null)
  returns table(notification_id uuid, payload jsonb);
mark_inquiry_email_notification_sent(p_notification_id uuid) returns void;
reschedule_inquiry_email_notification(p_notification_id uuid, p_error text) returns void;
```

Claim 1–10 due rows or `sending` rows locked over fifteen minutes, mark them `sending`, and return payloads. Reschedule stores only the first 300 error characters, delays through attempt five, then marks `failed`.

- [ ] **Step 4: Pass a safe serializable payload**

In `createInquiry`, pass:

```ts
{
  requestCode, requestKind: validation.data.requestKind,
  productName: product?.name ?? null, name: validation.data.name,
  contact: validation.data.contact, city: validation.data.city, state: validation.data.state,
  occasion: validation.data.occasion, description: validation.data.description,
  answers: validation.data.answers,
  attachments: attachmentRows.map(({ original_filename, mime_type, byte_size }) => ({
    filename: original_filename, mimeType: mime_type, byteSize: byte_size,
  })),
}
```

Do not add it to `InquiryResult` or any API response.

- [ ] **Step 5: Verify and commit**

Run: `pnpm vitest run src/test/unit/inquiry-service.test.ts`
Expected: PASS without a network call.

```bash
git add supabase/migrations/0005_inquiry_email_notifications.sql src/features/inquiries/service.ts src/test/unit/inquiry-service.test.ts
git commit -m "feat: queue lead notifications transactionally"
```

### Task 2: Add Gmail SMTP and queue processing

**Files:**
- Create: `src/features/inquiries/lead-email.ts`
- Create: `src/features/inquiries/lead-notifications.ts`
- Create: `src/test/unit/lead-email.test.ts`
- Create: `src/test/unit/lead-notifications.test.ts`
- Modify: `package.json`, `pnpm-lock.yaml`

**Interfaces:**
- Produces: `buildLeadEmail(payload)` and `deliverLeadNotifications(options, dependencies)`.
- Consumes: Task 1's private outbox functions.

- [ ] **Step 1: Write red mail and worker tests**

Test content and privacy:

```ts
expect(buildLeadEmail(payload)).toMatchObject({
  to: 'damazioatelier@gmail.com',
  subject: '[Damazio] Nova solicitação AB12CD34EF56GH78IJ90',
  text: expect.stringContaining('Ana'),
});
expect(buildLeadEmail(payload).text).not.toContain('private-file.png');
```

Use fake repository/sender tests to assert success calls `markSent`, SMTP rejection calls `reschedule` and continues, and missing configuration throws before a message is claimed.

- [ ] **Step 2: Run red tests**

Run: `pnpm vitest run src/test/unit/lead-email.test.ts src/test/unit/lead-notifications.test.ts`
Expected: FAIL because modules are absent.

- [ ] **Step 3: Implement strict server-only mail**

Run:

```bash
pnpm add nodemailer
pnpm add -D @types/nodemailer
```

In `lead-email.ts`, import `server-only`, validate all Gmail variables and create:

```ts
{ host: 'smtp.gmail.com', port: 465, secure: true,
  auth: { user: smtpUser, pass: smtpAppPassword } }
```

Export `LeadNotificationPayload`, `buildLeadEmail`, `sendLeadEmail`. Include protocol, contact, product/custom context, answers, description and attachment names/types/sizes only. Use `replyTo` only when the contact is a valid e-mail address.

- [ ] **Step 4: Implement the injectable worker**

Define:

```ts
type NotificationRepository = {
  claim: (limit: number, requestCode?: string) => Promise<Array<{ id: string; payload: LeadNotificationPayload }>>;
  markSent: (id: string) => Promise<void>;
  reschedule: (id: string, reason: string) => Promise<void>;
};
export async function deliverLeadNotifications(
  options: { requestCode?: string; limit?: number } = {},
  dependencies: { repository?: NotificationRepository; sender?: (payload: LeadNotificationPayload) => Promise<void> } = {},
): Promise<void>;
```

Default repository uses the server Supabase client and the Task 1 RPCs. Claim `options.limit ?? 10`; send then mark sent. On an individual send error, call reschedule with a generic error reason and continue. Never log payloads or secrets.

- [ ] **Step 5: Verify and commit**

Run: `pnpm vitest run src/test/unit/lead-email.test.ts src/test/unit/lead-notifications.test.ts`
Expected: PASS without SMTP credentials.

```bash
git add package.json pnpm-lock.yaml src/features/inquiries/lead-email.ts src/features/inquiries/lead-notifications.ts src/test/unit/lead-email.test.ts src/test/unit/lead-notifications.test.ts
git commit -m "feat: deliver queued leads through gmail smtp"
```

### Task 3: Deliver immediately and recover through cron

**Files:**
- Modify: `src/app/api/inquiries/route.ts`
- Create: `src/app/api/internal/lead-notifications/route.ts`
- Modify: `src/test/e2e/inquiry-api.spec.ts`
- Create: `src/test/e2e/lead-notifications-api.spec.ts`
- Create: `vercel.json`

**Interfaces:**
- Consumes: `deliverLeadNotifications({ requestCode, limit })`.
- Produces: unchanged public POST output and a secure recovery endpoint.

- [ ] **Step 1: Write red API tests**

Inject `deliverNotifications` into `createInquiryPostHandler`; assert it receives `{ requestCode, limit: 1 }` while the public body remains `{ requestCode, message }`.

For the internal handler, assert absent/wrong Bearer authorization returns `401`; `Bearer test-cron-secret` returns `{ processed: true }`, calls delivery with `{ limit: 10 }`, and contains no payload.

- [ ] **Step 2: Run red tests**

Run: `pnpm vitest run src/test/e2e/inquiry-api.spec.ts src/test/e2e/lead-notifications-api.spec.ts`
Expected: FAIL because injection and route do not exist.

- [ ] **Step 3: Attempt delivery only after persistence**

After `saveInquiry` resolves, call `deliverNotifications({ requestCode: result.requestCode, limit: 1 })` in isolated `try/catch`, then return the existing 201 JSON. Do not convert a SMTP error into a form failure.

- [ ] **Step 4: Create the secured Node route**

Compare the authorization header to the expected Bearer secret using equal-length UTF-8 buffers and `crypto.timingSafeEqual`. On success call `deliverLeadNotifications({ limit: 10 })` and return `{ processed: true }`. On failure return a generic 401/500 body using current private response headers.

- [ ] **Step 5: Add safe default cron**

Create:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "crons": [{ "path": "/api/internal/lead-notifications", "schedule": "0 8 * * *" }]
}
```

- [ ] **Step 6: Verify and commit**

Run: `pnpm vitest run src/test/e2e/inquiry-api.spec.ts src/test/e2e/lead-notifications-api.spec.ts`
Expected: PASS, including a successful form response when injected delivery rejects.

```bash
git add src/app/api/inquiries/route.ts src/app/api/internal/lead-notifications/route.ts src/test/e2e/inquiry-api.spec.ts src/test/e2e/lead-notifications-api.spec.ts vercel.json
git commit -m "feat: retry lead email notifications securely"
```

### Task 4: Center the card and expose Direct continuation

**Files:**
- Modify: `src/components/catalog/CustomRequestCard.tsx`
- Modify: `src/components/inquiries/InquiryForm.tsx`
- Modify: `src/styles/globals.css`
- Test: `src/test/component/InquiryForm.test.tsx`, `src/test/e2e/catalog.spec.ts`, `src/test/e2e/request-flow.spec.ts`

**Interfaces:**
- Consumes: `INSTAGRAM_PROFILE_URL` from `src/lib/site.ts`.
- Produces: centered card content and a safe external Direct link from every inquiry form.

- [ ] **Step 1: Write red tests**

Add:

```ts
expect(screen.getByRole('link', { name: 'Continuar pelo Direct' }))
  .toHaveAttribute('href', 'https://www.instagram.com/damazio.atelier/');
```

In E2E assert the custom-card link has `text-align: center`, is the single link to `/solicitar-orcamento`, and the Direct link has `target="_blank"` and `rel="noreferrer"`.

- [ ] **Step 2: Run red tests**

Run: `pnpm vitest run src/test/component/InquiryForm.test.tsx && pnpm playwright test src/test/e2e/catalog.spec.ts src/test/e2e/request-flow.spec.ts`
Expected: FAIL because Direct is absent and card text is left-aligned.

- [ ] **Step 3: Implement compact UI**

Import `INSTAGRAM_PROFILE_URL`; render a wrapping `.inquiry-form__actions` containing the current submit button and:

```tsx
<a className="button button--secondary" href={INSTAGRAM_PROFILE_URL} target="_blank" rel="noreferrer">
  Continuar pelo Direct
</a>
```

Preserve 44px targets. Add `justify-items: center` and `text-align: center` to the full-size `.custom-request-card__link` only.

- [ ] **Step 4: Verify and commit**

Run: `pnpm vitest run src/test/component/InquiryForm.test.tsx && pnpm playwright test src/test/e2e/catalog.spec.ts src/test/e2e/request-flow.spec.ts`
Expected: PASS without mobile overflow.

```bash
git add src/components/catalog/CustomRequestCard.tsx src/components/inquiries/InquiryForm.tsx src/styles/globals.css src/test/component/InquiryForm.test.tsx src/test/e2e/catalog.spec.ts src/test/e2e/request-flow.spec.ts
git commit -m "feat: add direct continuation to inquiry form"
```

### Task 5: Prepare privacy and production operation

**Files:**
- Modify: `.env.example`, `README.md`, `docs/operations/launch-checklist.md`
- Modify: `src/app/(site)/privacidade/page.tsx`
- Test: `src/test/e2e/institutional-pages.spec.ts`

- [ ] **Step 1: Write a red privacy test**

Assert the privacy page names Gmail as an operational processor for answering requests and retains `damazioatelier@gmail.com`.

- [ ] **Step 2: Run red test**

Run: `pnpm playwright test src/test/e2e/institutional-pages.spec.ts`
Expected: FAIL because Gmail processing is absent.

- [ ] **Step 3: Add exact operator setup**

Append blank values only:

```dotenv
GMAIL_SMTP_USER=
GMAIL_SMTP_APP_PASSWORD=
GMAIL_SMTP_FROM=
LEAD_NOTIFICATION_TO=damazioatelier@gmail.com
CRON_SECRET=
```

Document Vercel Git deployment, production-only secrets, Google 2-Step Verification/App Password, HTTPS URL, allowed origins, migration, private bucket, controlled form submission, Gmail inbox check, cron logs, Preview without SMTP and the Vercel Pro five-minute cron replacement.

Update Privacy: data are stored in Supabase and may be transmitted to Gmail only to notify Damazio and respond; visual references remain private and are never e-mail attachments.

- [ ] **Step 4: Verify release quality and commit**

Run:

```bash
pnpm playwright test src/test/e2e/institutional-pages.spec.ts
pnpm lint
pnpm test
pnpm build
pnpm e2e
git diff --check
```

Expected: all suites pass, staging-only smoke stays skipped without staging variables, and no whitespace errors are reported.

```bash
git add .env.example README.md docs/operations/launch-checklist.md src/app/(site)/privacidade/page.tsx src/test/e2e/institutional-pages.spec.ts
git commit -m "docs: prepare gmail lead delivery deployment"
```

## Plan self-review

- **Spec coverage:** Task 4 covers card alignment and Direct. Task 1 makes lead/outbox persistence atomic. Tasks 2–3 add Gmail delivery, retries and cron security. Task 5 covers privacy and Vercel operation.
- **Placeholder scan:** Environment names, SQL contracts, TypeScript interfaces, test commands and commit scopes are explicit.
- **Type consistency:** Task 1 serializes the payload; Task 2 defines `LeadNotificationPayload` and its worker; Task 3 calls that worker with the specified options.
