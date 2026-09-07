# Fluxo de Solicitação Livre Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir a criação livre com protocolo, disponibilizar e-mail em todo o site e concluir qualquer solicitação em uma experiência editorial coerente.

**Architecture:** O domínio de solicitações passa a distinguir `product` e `custom`. Pedidos `product` conservam vínculo e campos da inspiração; `custom` não recebem produto, mas são persistidos com a mesma proteção, anexos e protocolo. As rotas de solicitação compartilham um componente de experiência editorial, enquanto o header, o catálogo e o rodapé expõem os novos caminhos de atendimento.

**Tech Stack:** Next.js 16 App Router, React, TypeScript, Vitest, Testing Library, Playwright, Supabase SQL migrations, CSS global.

**Spec:** `docs/superpowers/specs/2026-09-06-fluxo-solicitacao-livre-design.md`

## Global Constraints

- O e-mail oficial é exatamente `damazioatelier@gmail.com`.
- Pedidos livres exigem uma descrição da ideia; pedidos por inspiração preservam as regras atuais.
- Anexos, limitação de envio, origem confiável, consentimento e respostas de erro privadas devem se comportar igual nos dois tipos de pedido.
- O header mantém `Ver catálogo` e inclui `Solicitar sua peça`.
- A confirmação mostra Direct e e-mail, com o protocolo no assunto do e-mail.
- Não alterar ou descartar modificações preexistentes fora dos arquivos desta entrega.

---

## File Structure

- `supabase/migrations/0004_custom_inquiries.sql` — evolui a tabela e a função RPC para armazenar solicitações livres sem produto.
- `src/features/inquiries/types.ts` — declara o tipo de solicitação e o formato normalizado de produto opcional.
- `src/features/inquiries/schema.ts` — valida regras comuns, regras de inspiração e regras de criação livre.
- `src/features/inquiries/service.ts` — envia a forma normalizada para a RPC, com produto nulo apenas para `custom`.
- `src/app/api/inquiries/route.ts` — interpreta `requestKind` e consulta produto somente para pedidos por inspiração.
- `src/lib/site.ts` and `src/lib/inquiry-email.ts` — centralizam o e-mail e constroem o `mailto:` seguro da confirmação.
- `src/components/inquiries/InquiryForm.tsx` — recebe o modo do pedido e torna a ideia obrigatória no modo livre.
- `src/components/inquiries/InquiryConfirmation.tsx` — apresenta as ações de e-mail e Direct.
- `src/components/inquiries/RequestExperience.tsx` — entrega a estrutura visual compartilhada pelas rotas de solicitação.
- `src/app/(site)/solicitar-orcamento/page.tsx` — cria a rota de solicitação livre.
- `src/app/(site)/solicitar-orcamento/[slug]/page.tsx` — adapta a rota de inspiração para a estrutura compartilhada.
- `src/components/catalog/CustomRequestCard.tsx` — card editorial para a criação livre no catálogo.
- `src/app/(site)/catalogo/page.tsx`, `src/components/layout/SiteHeader.tsx`, `src/components/layout/SiteFooter.tsx`, `src/app/(site)/contato/page.tsx`, `src/app/sitemap.ts`, `src/styles/globals.css` — expõem os acessos, os canais e a linguagem visual.
- `src/test/unit/inquiry-schema.test.ts`, `src/test/unit/inquiry-service.test.ts`, `src/test/e2e/inquiry-api.spec.ts`, `src/test/component/InquiryForm.test.tsx`, `src/test/component/InquiryConfirmation.test.tsx`, `src/test/e2e/request-flow.spec.ts`, `src/test/e2e/catalog.spec.ts`, `src/test/e2e/institutional-pages.spec.ts`, `src/test/e2e/seo-and-errors.spec.ts` — cobertura de domínio, UI e navegação.

## Task 1: Persistir e validar solicitações livres

**Files:**
- Create: `supabase/migrations/0004_custom_inquiries.sql`
- Modify: `src/features/inquiries/types.ts`, `src/features/inquiries/schema.ts`, `src/features/inquiries/service.ts`, `src/app/api/inquiries/route.ts`
- Test: `src/test/unit/inquiry-schema.test.ts`, `src/test/unit/inquiry-service.test.ts`, `src/test/e2e/inquiry-api.spec.ts`

**Interfaces:**
- Produces: `InquiryKind = 'product' | 'custom'`; `InquiryInput.requestKind`; `ValidInquiryInput.productSlug: string | null`; `createInquiry(input, product)` accepts `CatalogProduct | null` only for `custom`.
- Consumes: `CatalogProduct`, `inspectAttachments`, `createRequestCode`, and existing trusted-origin/rate-limit handlers.

- [ ] **Step 1: Write failing schema tests for a free creation and for its boundaries**

Add literal fixtures that submit `requestKind: 'custom'`, an empty product slug, no answers, and a nonempty description. Assert success returns `{ requestKind: 'custom', productSlug: null }`. Add separate cases asserting `description` is required for `custom`, a custom payload with answers is rejected, and a `product` request with no product remains rejected.

```ts
expect(validateInquiryInput({ ...baseInput, requestKind: 'custom', productSlug: '', description: 'Uma bolsa com flores bordadas', answers: {} }, null))
  .toMatchObject({ success: true, data: { requestKind: 'custom', productSlug: null } });

expect(validateInquiryInput({ ...baseInput, requestKind: 'custom', productSlug: '', description: '', answers: {} }, null))
  .toMatchObject({ success: false, errors: { description: 'Conte a sua ideia para continuar.' } });
```

- [ ] **Step 2: Run the schema test to verify it fails**

Run: `pnpm exec vitest run src/test/unit/inquiry-schema.test.ts`

Expected: FAIL because `requestKind` and the custom branch do not exist yet.

- [ ] **Step 3: Write a failing API and service boundary test**

Add an API test that sends a multipart body with `requestKind=custom`, empty `productSlug`, required common fields, a description and empty answers. Inject a persistence function that returns the public protocol and assert the HTTP result is `201`. Add a service test whose RPC spy receives `p_request_kind: 'custom'` and `p_product_id: null`.

```ts
const data = form();
data.set('requestKind', 'custom');
data.set('productSlug', '');
data.set('description', 'Quero uma peça para presentear minha mãe.');
const response = await post(request(data));
expect(response.status).toBe(201);
```

- [ ] **Step 4: Run the API and service tests to verify they fail**

Run:

```powershell
pnpm exec vitest run src/test/unit/inquiry-service.test.ts
pnpm build
pnpm exec playwright test src/test/e2e/inquiry-api.spec.ts
```

Expected: FAIL because the parser always loads a product and the service always requires one.

- [ ] **Step 5: Add the domain types and validation branches**

Add `InquiryKind` and preserve a normalized nullable slug in the validated data. Validate common fields first. For `custom`, require the normalized description, reject a product slug and nonempty answers, and return `productSlug: null`. For `product`, retain the existing product identity, availability, required-customization-field and option checks.

```ts
export type InquiryKind = 'product' | 'custom';

if (input.requestKind === 'custom') {
  if (!description) errors.description = 'Conte a sua ideia para continuar.';
  if (input.productSlug || answerEntries.length > 0) errors.productSlug = 'Confira a criação informada.';
} else if (!product || product.slug !== normalizedProductSlug) {
  errors.productSlug = 'A peça selecionada não foi encontrada.';
}
```

- [ ] **Step 6: Add the migration and adapt the service/API**

Create migration `0004_custom_inquiries.sql` that adds `request_kind text not null default 'product'` with a check limited to `product` and `custom`, drops `inquiries.product_id` `NOT NULL`, and adds a table check requiring product for `product` and null product for `custom`. Drop the old exact `create_inquiry_with_answers(text, uuid, text, text, text, char, text, text, timestamptz, jsonb, jsonb)` signature, then create its replacement with appended `p_request_kind text`; it must reject invalid kind/product pairs, reject custom answers, insert `request_kind`, and insert answer rows only for a product request. Revoke and grant only the exact new RPC signature to `service_role`.

Update the API parser to read `requestKind`, load a product only when the kind is `product`, and pass `null` to the service for a custom request. Update the service RPC payload with `p_request_kind` and `p_product_id: product?.id ?? null`.

```sql
alter table public.inquiries add column request_kind text not null default 'product'
  check (request_kind in ('product', 'custom'));
alter table public.inquiries alter column product_id drop not null;
alter table public.inquiries add constraint inquiries_kind_product_check check (
  (request_kind = 'product' and product_id is not null) or
  (request_kind = 'custom' and product_id is null)
);
```

- [ ] **Step 7: Run focused tests to verify they pass**

Run:

```powershell
pnpm exec vitest run src/test/unit/inquiry-schema.test.ts src/test/unit/inquiry-service.test.ts
pnpm build
pnpm exec playwright test src/test/e2e/inquiry-api.spec.ts
```

Expected: PASS, including both the original product flow and the new custom flow.

- [ ] **Step 8: Commit the domain and migration slice**

Run:

```powershell
git add -- supabase/migrations/0004_custom_inquiries.sql src/features/inquiries/types.ts src/features/inquiries/schema.ts src/features/inquiries/service.ts src/app/api/inquiries/route.ts src/test/unit/inquiry-schema.test.ts src/test/unit/inquiry-service.test.ts src/test/e2e/inquiry-api.spec.ts
git commit -m "feat: accept custom creation inquiries"
```

## Task 2: Criar a experiência de formulário livre e os canais da confirmação

**Files:**
- Create: `src/lib/inquiry-email.ts`, `src/components/inquiries/RequestExperience.tsx`, `src/app/(site)/solicitar-orcamento/page.tsx`
- Modify: `src/lib/site.ts`, `src/components/inquiries/InquiryForm.tsx`, `src/components/inquiries/InquiryConfirmation.tsx`, `src/app/(site)/solicitar-orcamento/[slug]/page.tsx`, `src/styles/globals.css`
- Test: `src/test/component/InquiryForm.test.tsx`, `src/test/component/InquiryConfirmation.test.tsx`, `src/test/e2e/request-flow.spec.ts`

**Interfaces:**
- Consumes: `InquiryKind`, optional `CatalogProduct`, `INQUIRY_EMAIL_ADDRESS`, `buildInstagramProfileUrl`.
- Produces: `RequestExperience({ requestKind, product? })`, direct route `/solicitar-orcamento`, and `buildInquiryEmailUrl(requestCode)`.

- [ ] **Step 1: Write failing component tests for the custom form and e-mail confirmation**

Render `InquiryForm` with `requestKind="custom"` and no product. Assert the idea textbox is required and the submitted multipart data includes `requestKind=custom`, blank `productSlug`, and `{}` answers. Render `InquiryConfirmation` and assert both `Abrir Direct` and `Enviar e-mail` links exist; the e-mail href must target `damazioatelier@gmail.com` and include the literal request code in `subject`.

```tsx
render(<InquiryForm requestKind="custom" fetcher={fetcher} />);
expect(screen.getByRole('textbox', { name: /conte a sua ideia/i })).toBeRequired();

expect(screen.getByRole('link', { name: 'Enviar e-mail' })).toHaveAttribute(
  'href', expect.stringContaining('subject=Solicita%C3%A7%C3%A3o%20AB12CD34EF56GH78IJ90'),
);
```

- [ ] **Step 2: Run component tests to verify they fail**

Run: `pnpm exec vitest run src/test/component/InquiryForm.test.tsx src/test/component/InquiryConfirmation.test.tsx`

Expected: FAIL because the form requires a product prop and confirmation has no e-mail action.

- [ ] **Step 3: Implement the e-mail helper and mode-aware form**

Export `INQUIRY_EMAIL_ADDRESS = 'damazioatelier@gmail.com'` from `site.ts`. Make `buildInquiryEmailUrl` URL-encode the subject `Solicitação <code> | Damazio Atelier` and a concise body, with no user-entered data. Let `InquiryForm` receive `{ requestKind, product? }`; derive customization fields only from a present product, serialize `requestKind`, and make the free-form description label and requirement conditional.

```ts
export function buildInquiryEmailUrl(requestCode: string): string {
  const params = new URLSearchParams({
    subject: `Solicitação ${requestCode} | Damazio Atelier`,
    body: `Olá, gostaria de continuar sobre a solicitação ${requestCode}.`,
  });
  return `mailto:${INQUIRY_EMAIL_ADDRESS}?${params.toString()}`;
}
```

- [ ] **Step 4: Implement the shared request experience and routes**

Create `RequestExperience` so both modes render a `request-page-editorial` main region, a dark editorial introduction and a light form surface. The custom copy is `Crie a sua peça` with a prompt to explain the idea; the product copy retains the selected product name. Create the static page with custom metadata and reuse the component from the dynamic page after product lookup. Keep unavailable-product handling unchanged.

```tsx
<RequestExperience requestKind="custom" />

<RequestExperience requestKind="product" product={product} />
```

- [ ] **Step 5: Add the confirmation e-mail action and editorial styles**

Place the Direct and e-mail links in an action group below the public protocol. Add responsive styles for `.request-page-editorial`, `.request-page__surface`, `.inquiry-confirmation__actions`, and both action buttons so the form is readable on 320px and full-width on desktop.

- [ ] **Step 6: Run focused tests to verify they pass**

Run:

```powershell
pnpm exec vitest run src/test/component/InquiryForm.test.tsx src/test/component/InquiryConfirmation.test.tsx
pnpm build
pnpm exec playwright test src/test/e2e/request-flow.spec.ts
```

Expected: PASS. The existing inspiration request tests continue to use the same endpoint; the custom route completes after mocked API success and exposes both contact actions.

- [ ] **Step 7: Commit the request experience slice**

Run:

```powershell
git add -- src/lib/site.ts src/lib/inquiry-email.ts src/components/inquiries/InquiryForm.tsx src/components/inquiries/InquiryConfirmation.tsx src/components/inquiries/RequestExperience.tsx src/app/(site)/solicitar-orcamento/page.tsx src/app/(site)/solicitar-orcamento/[slug]/page.tsx src/styles/globals.css src/test/component/InquiryForm.test.tsx src/test/component/InquiryConfirmation.test.tsx src/test/e2e/request-flow.spec.ts
git commit -m "feat: add direct custom request flow"
```

## Task 3: Expor a criação livre e e-mail na navegação do site

**Files:**
- Create: `src/components/catalog/CustomRequestCard.tsx`
- Modify: `src/components/layout/SiteHeader.tsx`, `src/components/layout/SiteFooter.tsx`, `src/app/(site)/catalogo/page.tsx`, `src/app/(site)/contato/page.tsx`, `src/app/sitemap.ts`, `src/styles/globals.css`
- Test: `src/test/e2e/catalog.spec.ts`, `src/test/e2e/institutional-pages.spec.ts`, `src/test/e2e/seo-and-errors.spec.ts`

**Interfaces:**
- Consumes: `INQUIRY_EMAIL_ADDRESS`, `INSTAGRAM_PROFILE_URL`, `Button` styling and the static route `/solicitar-orcamento`.
- Produces: a navigation link named `Solicitar sua peça`, a catalog link named `Criar a sua peça`, and a visible mailto link named `damazioatelier@gmail.com`.

- [ ] **Step 1: Write failing navigation and catalog tests**

Add a desktop-and-mobile-safe header assertion for a link named `Solicitar sua peça` with href `/solicitar-orcamento`. Add a catalog assertion for the `Criar a sua peça` link with the same href and for six cards in the grid. Assert the footer contains a `mailto:damazioatelier@gmail.com` link and `/contato` exposes both the e-mail and official Instagram destination. Add `/solicitar-orcamento` to the expected sitemap URLs.

```ts
await expect(page.getByRole('link', { name: 'Solicitar sua peça' })).toHaveAttribute('href', '/solicitar-orcamento');
await expect(page.getByRole('link', { name: 'Criar a sua peça' })).toHaveAttribute('href', '/solicitar-orcamento');
await expect(page.locator('.site-footer').getByRole('link', { name: 'damazioatelier@gmail.com' })).toHaveAttribute('href', 'mailto:damazioatelier@gmail.com');
```

- [ ] **Step 2: Run the navigation tests to verify they fail**

Run:

```powershell
pnpm build
pnpm exec playwright test src/test/e2e/catalog.spec.ts src/test/e2e/institutional-pages.spec.ts src/test/e2e/seo-and-errors.spec.ts
```

Expected: FAIL because none of the new links or the static sitemap route exists.

- [ ] **Step 3: Implement the header, custom catalog card, footer, contact page and sitemap**

Add a second header action without removing `Ver catálogo`; put the direct link in the mobile menu as well and include `/solicitar-orcamento` in the header's editorial-overlay pathname matching. Render `CustomRequestCard` after the five line cards with eyebrow `Sem inspiração em mente?`, heading `Crie a sua peça`, supportive copy, and link text `Criar a sua peça`. Render the official e-mail link in the footer and provide separate e-mail and Instagram actions on `/contato`. Add the static route to `staticPublicPaths`.

```tsx
<article className="custom-request-card">
  <p className="eyebrow">Sem inspiração em mente?</p>
  <h3>Crie a sua peça</h3>
  <p>Conte a ideia que você quer transformar em uma criação com a Damazio.</p>
  <a href="/solicitar-orcamento">Criar a sua peça</a>
</article>
```

- [ ] **Step 4: Implement responsive visual treatment for the new actions and card**

Group header actions so `Ver catálogo` remains secondary and `Solicitar sua peça` reads as the primary action on light, overlay and scrolled headers. Give the custom card a dark/terracotta editorial background, high-contrast text and a textural pseudo-element without product imagery. At `min-width: 64rem`, set `.catalog-lines .line-grid` to three equal columns so the five inspiration cards plus the custom card form two balanced rows; preserve two columns at tablet and one at mobile without changing line grids in other sections.

- [ ] **Step 5: Run focused tests to verify they pass**

Run:

```powershell
pnpm build
pnpm exec playwright test src/test/e2e/catalog.spec.ts src/test/e2e/institutional-pages.spec.ts src/test/e2e/seo-and-errors.spec.ts
```

Expected: PASS, with the direct entry points, e-mail channel and sitemap route discoverable to users and crawlers.

- [ ] **Step 6: Commit the site navigation slice**

Run:

```powershell
git add -- src/components/catalog/CustomRequestCard.tsx src/components/layout/SiteHeader.tsx src/components/layout/SiteFooter.tsx src/app/(site)/catalogo/page.tsx src/app/(site)/contato/page.tsx src/app/sitemap.ts src/styles/globals.css src/test/e2e/catalog.spec.ts src/test/e2e/institutional-pages.spec.ts src/test/e2e/seo-and-errors.spec.ts
git commit -m "feat: expose custom request and email channels"
```

## Task 4: Validate the complete flow

**Files:**
- Modify only if verification exposes an actual defect in a file from Tasks 1–3.

**Interfaces:**
- Consumes: all routes, the inquiry API, application metadata, and test suites from Tasks 1–3.
- Produces: fresh verification evidence for the delivered flow.

- [ ] **Step 1: Run unit and component coverage**

Run: `pnpm test`

Expected: all Vitest suites pass, including validation, persistence and components.

- [ ] **Step 2: Run lint and production build**

Run:

```powershell
pnpm lint
pnpm build
```

Expected: ESLint exits cleanly and Next.js builds both `/solicitar-orcamento` and `/solicitar-orcamento/[slug]`.

- [ ] **Step 3: Run full browser and accessibility coverage**

Run: `pnpm e2e`

Expected: all local Playwright tests pass; staging-only smoke tests may remain skipped when no staging URL is configured.

- [ ] **Step 4: Inspect the final diff before delivery**

Run:

```powershell
git diff --check
git status --short
```

Expected: no whitespace errors. Report only files from this plan and preserve unrelated preexisting changes.
