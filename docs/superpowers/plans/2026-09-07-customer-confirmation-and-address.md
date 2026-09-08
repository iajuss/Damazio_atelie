# Customer Confirmation and Address Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Collect complete delivery/contact data, autofill address details from CEP, and send an independent confirmation e-mail containing the request protocol.

**Architecture:** The browser looks up CEP through a small server route backed by ViaCEP and keeps every suggested address field editable. The inquiry API validates and persists the full address through a new, additive Supabase RPC. A two-recipient notification queue sends the operational lead to the Atelier and a minimal confirmation to the customer independently.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Vitest, Supabase Postgres/RPC, Nodemailer/Gmail SMTP, ViaCEP HTTP API.

**Spec:** `docs/superpowers/specs/2026-09-07-customer-confirmation-and-address-design.md`

## Global Constraints

- Keep existing inquiry rows and the existing `create_inquiry_with_answers` RPC working for deployments in flight.
- New customer data is collected only after the existing privacy-consent checkbox is accepted.
- CEP lookup sends only eight digits to ViaCEP, has no credentials, and always permits manual address entry after an error.
- Phone, email, CEP, street, number, neighborhood, city, and UF are required; complement is optional.
- The customer e-mail must prominently include the protocol but must not repeat address or uploaded-file details.
- The Atelier and customer notifications must retry independently; no retry may duplicate the other recipient’s message.
- Do not expose SMTP credentials, the Supabase service-role key, private attachment paths, or customer address data in browser logs.

---

### Task 1: Define validated contact and address data

**Files:**
- Modify: `src/features/inquiries/types.ts`
- Modify: `src/features/inquiries/schema.ts`
- Modify: `src/test/unit/inquiry-schema.test.ts`

**Interfaces:**
- Produces `InquiryInput`/`ValidInquiryInput` fields: `email`, `phone`, `postalCode`, `street`, `addressNumber`, `complement`, and `neighborhood`.
- Consumers: `InquiryForm`, the inquiry API parser, `createInquiry`, and the customer-email payload.

- [ ] **Step 1: Write the failing validation tests**

```ts
it('normaliza telefone, e-mail e endereço completo', () => {
  expect(validateInquiryInput(validInput({
    email: ' ANA@EXAMPLE.COM ', phone: '(11) 91077-1179', postalCode: '01310-100',
    street: '  Avenida Paulista ', addressNumber: ' 1578 ', complement: ' ap. 12 ',
    neighborhood: ' Bela Vista ', city: ' São Paulo ', state: 'sp',
  }), product)).toMatchObject({ success: true, data: {
    email: 'ana@example.com', phone: '11910771179', postalCode: '01310100',
    street: 'Avenida Paulista', addressNumber: '1578', complement: 'ap. 12',
    neighborhood: 'Bela Vista', city: 'São Paulo', state: 'SP',
  }});
});

it.each(['email', 'phone', 'postalCode', 'street', 'addressNumber', 'neighborhood'])(
  'rejeita %s ausente ou inválido',
  (field) => expect(validateInquiryInput(validInput({ [field]: '' }), product)).toMatchObject({ success: false }),
);
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `pnpm test -- src/test/unit/inquiry-schema.test.ts`

Expected: failure because the new fields are not part of `InquiryInput` or are not validated.

- [ ] **Step 3: Add normalized fields and minimal validators**

```ts
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneDigits = normalize(input.phone).replace(/\D/g, '');
const postalCode = normalize(input.postalCode).replace(/\D/g, '');

if (!emailPattern.test(email)) errors.email = 'Informe um e-mail válido.';
if (phoneDigits.length < 10 || phoneDigits.length > 11) errors.phone = 'Informe um telefone válido.';
if (!/^\d{8}$/.test(postalCode)) errors.postalCode = 'Informe um CEP com oito dígitos.';
```

Normalize all address text with the existing `normalize` helper and preserve the current `city`/`state` validation for compatibility.

- [ ] **Step 4: Re-run the focused validation test**

Run: `pnpm test -- src/test/unit/inquiry-schema.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit the validated input contract**

```bash
git add src/features/inquiries/types.ts src/features/inquiries/schema.ts src/test/unit/inquiry-schema.test.ts
git commit -m "feat: validate inquiry contact and address"
```

### Task 2: Add a safe CEP lookup boundary

**Files:**
- Create: `src/features/address/cep.ts`
- Create: `src/app/api/cep/[postalCode]/route.ts`
- Create: `src/test/unit/cep.test.ts`

**Interfaces:**
- Produces `lookupCep(postalCode, fetcher)` returning `{ street, neighborhood, city, state }` or a typed lookup result.
- Route: `GET /api/cep/:postalCode` returns only `{ street, neighborhood, city, state }` and never returns ViaCEP’s raw response.
- Consumers: `CepAddressFields` in Task 3.

- [ ] **Step 1: Write failing tests for a successful and invalid CEP lookup**

```ts
it('normaliza o retorno do ViaCEP para os campos do formulário', async () => {
  const result = await lookupCep('01310100', async () => Response.json({
    logradouro: 'Avenida Paulista', bairro: 'Bela Vista', localidade: 'São Paulo', uf: 'SP', erro: false,
  }));
  expect(result).toEqual({ street: 'Avenida Paulista', neighborhood: 'Bela Vista', city: 'São Paulo', state: 'SP' });
});

it('retorna 400 para um CEP que não tenha oito dígitos', async () => {
  const response = await GET(new Request('https://damazio.example/api/cep/123'));
  expect(response.status).toBe(400);
});
```

- [ ] **Step 2: Run the new test file to verify it fails**

Run: `pnpm test -- src/test/unit/cep.test.ts`

Expected: failure because the lookup module and route do not exist.

- [ ] **Step 3: Implement the lookup with timeout and manual-fallback error**

```ts
const cep = postalCode.replace(/\D/g, '');
if (!/^\d{8}$/.test(cep)) throw new CepLookupError('CEP inválido.');
const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
  signal: AbortSignal.timeout(5_000),
  headers: { accept: 'application/json' },
});
```

Map only `logradouro`, `bairro`, `localidade`, and `uf`; treat a non-OK response or `erro: true` as a recoverable lookup error. The route must use `cache-control: no-store` and return a generic Portuguese error with no upstream body.

- [ ] **Step 4: Re-run the CEP tests**

Run: `pnpm test -- src/test/unit/cep.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit the CEP boundary**

```bash
git add src/features/address/cep.ts src/app/api/cep/[postalCode]/route.ts src/test/unit/cep.test.ts
git commit -m "feat: add CEP address lookup"
```

### Task 3: Replace generic location fields with complete-address fields

**Files:**
- Create: `src/components/inquiries/CepAddressFields.tsx`
- Modify: `src/components/inquiries/InquiryForm.tsx`
- Modify: `src/test/component/InquiryForm.test.tsx`
- Create: `src/test/component/CepAddressFields.test.tsx`

**Interfaces:**
- `CepAddressFields` renders named native inputs `postalCode`, `street`, `addressNumber`, `complement`, `neighborhood`, `city`, and `state`.
- Props: `errors: Record<string, string>` and `lookupCep?: (postalCode: string) => Promise<AddressSuggestion>`.
- `InquiryForm` appends those values as multipart fields consumed by the API in Task 4.

- [ ] **Step 1: Write failing component tests**

```tsx
it('preenche endereço sugerido pelo CEP e permite corrigir a rua', async () => {
  render(<CepAddressFields errors={{}} lookupCep={async () => ({ street: 'Avenida Paulista', neighborhood: 'Bela Vista', city: 'São Paulo', state: 'SP' })} />);
  fireEvent.change(screen.getByRole('textbox', { name: /cep/i }), { target: { value: '01310-100' } });
  expect(await screen.findByDisplayValue('Avenida Paulista')).toBeInTheDocument();
  fireEvent.change(screen.getByRole('textbox', { name: /rua/i }), { target: { value: 'Rua corrigida' } });
  expect(screen.getByDisplayValue('Rua corrigida')).toBeInTheDocument();
});

it('envia e-mail, telefone e endereço em vez de contato genérico', async () => {
  const fetcher = vi.fn().mockResolvedValue(response(201, { requestCode: 'AB12CD34EF56GH78IJ90', message: 'Solicitação registrada com sucesso.' }));
  render(<InquiryForm requestKind="custom" fetcher={fetcher} />);
  fireEvent.change(screen.getByRole('textbox', { name: /seu nome/i }), { target: { value: 'Ana' } });
  fireEvent.change(screen.getByRole('textbox', { name: /telefone/i }), { target: { value: '(11) 91077-1179' } });
  fireEvent.change(screen.getByRole('textbox', { name: /e-mail/i }), { target: { value: 'ana@example.com' } });
  fireEvent.change(screen.getByRole('textbox', { name: /cep/i }), { target: { value: '01310-100' } });
  fireEvent.change(screen.getByRole('textbox', { name: /rua/i }), { target: { value: 'Avenida Paulista' } });
  fireEvent.change(screen.getByRole('textbox', { name: /número/i }), { target: { value: '1578' } });
  fireEvent.change(screen.getByRole('textbox', { name: /bairro/i }), { target: { value: 'Bela Vista' } });
  fireEvent.change(screen.getByRole('textbox', { name: /cidade/i }), { target: { value: 'São Paulo' } });
  fireEvent.change(screen.getByRole('textbox', { name: /uf/i }), { target: { value: 'SP' } });
  fireEvent.change(screen.getByRole('textbox', { name: /conte a sua ideia/i }), { target: { value: 'Uma bolsa para presentear.' } });
  fireEvent.click(screen.getByRole('checkbox', { name: /política de privacidade/i }));
  fireEvent.submit(screen.getByRole('button', { name: 'Enviar solicitação' }).closest('form')!);
  await screen.findByRole('heading', { name: 'Solicitação enviada' });
  const body = fetcher.mock.calls[0][1].body as FormData;
  expect(body.get('email')).toBe('ana@example.com');
  expect(body.get('phone')).toBe('(11) 91077-1179');
  expect(body.get('postalCode')).toBe('01310-100');
  expect(body.get('addressNumber')).toBe('1578');
});
```

- [ ] **Step 2: Run the component tests to verify they fail**

Run: `pnpm test -- src/test/component/CepAddressFields.test.tsx src/test/component/InquiryForm.test.tsx`

Expected: failure because the new controls and FormData fields do not exist.

- [ ] **Step 3: Implement CEP masking, lookup, and address inputs**

Use a text input with `inputMode="numeric"` and format the eight digits as `00000-000`. Start lookup only after eight digits; keep an in-flight status announcement accessible to screen readers. Render lookup failure text beside the CEP input and do not disable any address input.

Replace `Contato`, `Cidade`, and `Estado` controls in `InquiryForm` with `Telefone`, `E-mail`, and `CepAddressFields`. Append this exact multipart contract:

```ts
data.set('email', submittedValues.email);
data.set('phone', submittedValues.phone);
data.set('postalCode', submittedValues.postalCode);
data.set('street', submittedValues.street);
data.set('addressNumber', submittedValues.addressNumber);
data.set('complement', submittedValues.complement);
data.set('neighborhood', submittedValues.neighborhood);
data.set('city', submittedValues.city);
data.set('state', submittedValues.state);
```

- [ ] **Step 4: Re-run the focused component tests**

Run: `pnpm test -- src/test/component/CepAddressFields.test.tsx src/test/component/InquiryForm.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit the form experience**

```bash
git add src/components/inquiries/CepAddressFields.tsx src/components/inquiries/InquiryForm.tsx src/test/component/CepAddressFields.test.tsx src/test/component/InquiryForm.test.tsx
git commit -m "feat: collect complete inquiry address"
```

### Task 4: Persist the new lead contract atomically

**Files:**
- Modify: `src/app/api/inquiries/route.ts`
- Modify: `src/features/inquiries/service.ts`
- Create: `supabase/migrations/0007_inquiry_contact_address_and_confirmation.sql`
- Modify: `src/test/unit/inquiry-api.test.ts`
- Modify: `src/test/unit/inquiry-service.test.ts`

**Interfaces:**
- New RPC: `create_inquiry_with_contact_details(...) returns table(inquiry_id uuid)`.
- Existing `create_inquiry_with_answers` remains untouched for older deploys.
- New RPC inserts the inquiry and two notification queue rows in one transaction.

- [ ] **Step 1: Write failing parser and service tests**

```ts
const data = new FormData();
for (const [key, value] of Object.entries({
  requestKind: 'product', productSlug: 'toalha-bordada', name: 'Ana', email: 'ana@example.com', phone: '11910771179',
  postalCode: '01310100', street: 'Avenida Paulista', addressNumber: '1578', complement: '', neighborhood: 'Bela Vista',
  city: 'São Paulo', state: 'SP', answers: '{}', privacyAccepted: 'true', website: '',
})) data.set(key, value);
const response = await post(new Request('https://damazio.example/api/inquiries', { method: 'POST', body: data, headers: { origin: 'https://damazio.example' } }));
expect(response.status).toBe(201);

expect(rpcPayload).toMatchObject({
  p_email: 'ana@example.com', p_phone: '11910771179', p_postal_code: '01310100',
  p_street: 'Avenida Paulista', p_address_number: '1578', p_neighborhood: 'Bela Vista',
});
```

- [ ] **Step 2: Run the focused API and service tests to verify they fail**

Run: `pnpm test -- src/test/unit/inquiry-api.test.ts src/test/unit/inquiry-service.test.ts`

Expected: failure because the parser drops the new multipart fields and the service calls the legacy RPC.

- [ ] **Step 3: Implement parser/service contract and additive SQL migration**

In the API parser, read every new FormData field. In the service, call `create_inquiry_with_contact_details` and accept either a single RPC row or the array returned by Supabase.

The migration must:

```sql
alter table public.inquiries add column if not exists email text;
alter table public.inquiries add column if not exists phone text;
alter table public.inquiries add column if not exists postal_code text;
alter table public.inquiries add column if not exists street text;
alter table public.inquiries add column if not exists address_number text;
alter table public.inquiries add column if not exists complement text;
alter table public.inquiries add column if not exists neighborhood text;
```

Add `recipient_kind text not null default 'atelier' check (recipient_kind in ('atelier', 'customer'))` to `inquiry_email_notifications`; replace its one-row-per-inquiry unique constraint with `unique (inquiry_id, recipient_kind)`. The new security-definer function must insert `atelier` and `customer` rows with the same `v_inquiry_id`, then return it. Revoke public execution and grant it only to `service_role`.

- [ ] **Step 4: Re-run API and service tests**

Run: `pnpm test -- src/test/unit/inquiry-api.test.ts src/test/unit/inquiry-service.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit persistence changes**

```bash
git add src/app/api/inquiries/route.ts src/features/inquiries/service.ts supabase/migrations/0007_inquiry_contact_address_and_confirmation.sql src/test/unit/inquiry-api.test.ts src/test/unit/inquiry-service.test.ts
git commit -m "feat: persist complete inquiry contact details"
```

### Task 5: Deliver independent Atelier and customer emails

**Files:**
- Modify: `src/features/inquiries/lead-email.ts`
- Modify: `src/features/inquiries/lead-notifications.ts`
- Modify: `src/test/unit/lead-email.test.ts`
- Modify: `src/test/unit/lead-notifications.test.ts`

**Interfaces:**
- `buildLeadEmail(payload, config)` produces the complete Atelier lead.
- `buildCustomerConfirmationEmail(payload, config)` produces the minimal customer confirmation.
- Claimed notification rows include `recipientKind: 'atelier' | 'customer'`.

- [ ] **Step 1: Write failing e-mail and retry-isolation tests**

```ts
expect(buildCustomerConfirmationEmail(customerPayload)).toMatchObject({
  to: 'ana@example.com', subject: expect.stringContaining('AB12CD34EF56GH78IJ90'),
});
expect(buildCustomerConfirmationEmail(customerPayload).text).toContain('Protocolo: AB12CD34EF56GH78IJ90');
expect(buildCustomerConfirmationEmail(customerPayload).text).not.toContain('Avenida Paulista');

// customer failure queues only the customer row; Atelier row is marked sent once.
expect(queue.sent).toEqual(['atelier-row']);
expect(queue.retried).toEqual(['customer-row']);
```

- [ ] **Step 2: Run the focused notification tests to verify they fail**

Run: `pnpm test -- src/test/unit/lead-email.test.ts src/test/unit/lead-notifications.test.ts`

Expected: failure because notification rows have no recipient type and the confirmation builder does not exist.

- [ ] **Step 3: Implement recipient-specific message builders and delivery**

The Atelier e-mail must show protocol, phone, e-mail, and one formatted address line. Set `replyTo` to the validated customer e-mail. The customer text must contain only greeting, protocol, acknowledgement, and next-step copy.

`notificationRepository.claim` must map `recipient_kind`; `deliverLeadNotifications` must select the corresponding sender for each claimed row. Preserve the existing retry and `markSent` behavior per notification id.

- [ ] **Step 4: Re-run the notification tests**

Run: `pnpm test -- src/test/unit/lead-email.test.ts src/test/unit/lead-notifications.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit notification delivery**

```bash
git add src/features/inquiries/lead-email.ts src/features/inquiries/lead-notifications.ts src/test/unit/lead-email.test.ts src/test/unit/lead-notifications.test.ts
git commit -m "feat: send inquiry confirmation to customer"
```

### Task 6: Update privacy copy and run end-to-end verification

**Files:**
- Modify: `src/app/(site)/privacidade/page.tsx`
- Modify: `src/test/e2e/request-flow.spec.ts`
- Modify: `src/test/e2e/accessibility.spec.ts` only if role/name expectations need updating

**Interfaces:**
- Privacy page states the purpose of telephone, email, postal and address data, plus the customer confirmation e-mail.
- End-to-end request flow uses the new required address inputs.

- [ ] **Step 1: Write the failing public-copy and request-flow assertions**

```ts
await expect(page.getByRole('heading', { name: /solicitação enviada/i })).toBeVisible();
await expect(page.getByLabel('CEP *')).toBeVisible();
await expect(page.getByRole('main')).toContainText('telefone, e-mail e endereço');
```

- [ ] **Step 2: Run the focused browser tests to verify they fail**

Run: `pnpm playwright test src/test/e2e/request-flow.spec.ts src/test/e2e/accessibility.spec.ts`

Expected: failure because the old form/copy still uses generic contact and city/UF fields.

- [ ] **Step 3: Update privacy copy and browser fixtures**

Change the privacy page’s data list from generic contact/city/state to telephone, email, CEP and complete address. Keep the statement that visual references remain private and are not e-mail attachments. Update the request-flow fixture with a valid manually entered address so it never depends on ViaCEP availability.

- [ ] **Step 4: Run focused browser tests, then complete verification**

Run:

```bash
pnpm playwright test src/test/e2e/request-flow.spec.ts src/test/e2e/accessibility.spec.ts
pnpm lint
pnpm test
pnpm build
```

Expected: all commands exit 0.

- [ ] **Step 5: Commit the final public copy and verification updates**

```bash
git add src/app/(site)/privacidade/page.tsx src/test/e2e/request-flow.spec.ts src/test/e2e/accessibility.spec.ts
git commit -m "docs: explain inquiry address handling"
```

## Rollout checklist

- [ ] Merge and push the application changes.
- [ ] Run `0007_inquiry_contact_address_and_confirmation.sql` once in the Supabase SQL Editor after the Vercel deployment is ready.
- [ ] Submit one controlled production request using a real recipient e-mail.
- [ ] Confirm one complete lead e-mail reaches `damazioatelier@gmail.com` and one minimal confirmation, with the same protocol, reaches the provided e-mail.
- [ ] Confirm the two notification rows become `sent` independently in `inquiry_email_notifications`.
