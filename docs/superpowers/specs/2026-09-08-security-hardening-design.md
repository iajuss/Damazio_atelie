# Security Hardening Design

## Scope

Harden the public inquiry flow without changing the contact/address data model that was added by a separate change. The README is explicitly out of scope because it was updated independently.

## Objectives

- Prevent accidental environment-file commits while retaining `.env.example`.
- Make request admission bounded before multipart parsing, accept only multipart form submissions, and preserve existing per-file validation.
- Use the Vercel-provided client-IP header only in an explicitly trusted deployment context; retain a safe fallback elsewhere.
- Remove provider-supplied messages from application logs.
- Add security response headers and a tested CSP that keeps the current static Next.js application functional.
- Harden private-storage and `security definer` database configuration through a new migration file only. It must never be applied remotely during this work.
- Make SMTP retry duplicates easier for recipients to deduplicate by using a deterministic message identifier per notification.
- Upgrade the resolved Supabase authentication dependency beyond the audited vulnerable version while retaining the repository's Node 20.9+ support contract.

## Boundaries

- No Vercel, Supabase, Gmail, GitHub, or database remote operation is permitted.
- No secret values are read, logged, added to tests, or written to files.
- Browser-facing code must continue to receive only an inquiry protocol and generic error messages.
- Existing fields for email, phone, CEP, and address are preserved but not redesigned.

## Design

The inquiry route becomes a strict multipart boundary: it rejects an incompatible `Content-Type`, rejects a valid declared body size above the aggregate upload budget, and only then invokes `formData()`. Existing magic-byte, file-count, and individual-size validation remains authoritative for each file. Error logging is reduced to an event name and known processing stage.

The in-memory limiter remains a local fallback rather than a claim of global protection. In Vercel deployments, it derives the key from `x-vercel-forwarded-for`, which Vercel documents as protected from client spoofing when it controls the edge. Production deployment must additionally configure a Vercel Firewall/WAF rate rule; that dashboard action remains a manual post-change verification item.

Static security headers are defined in `next.config.ts`. They include HSTS, anti-framing, MIME sniffing protection, referrer and permissions policies, cross-origin isolation defaults, and a CSP compatible with static Next.js App Router output. The current renderer emits response-specific inline streaming scripts, so the static CSP necessarily permits inline scripts/styles; a nonce-based strict CSP would require a proxy and dynamic rendering of every page, which is intentionally excluded from this change. Browser E2E coverage verifies both headers and normal interactive rendering.

A forward-only SQL migration pins every current privileged function (`create_inquiry_with_contact_details`, `claim_inquiry_email_notifications`, `mark_inquiry_email_notification_sent`, and `reschedule_inquiry_email_notification`) to an empty search path with schema-qualified references, revokes implicit function execution privileges, and gives the private bucket an explicit size/MIME envelope. It does not change live data until the user separately applies it through their approved Supabase process.

SMTP remains at-least-once because an SMTP server can accept a message before the queue state is committed. Each message receives a deterministic, sanitized `Message-ID` derived from its notification kind and request code, enabling mail clients and operational tooling to recognize retries without pretending to guarantee exactly-once delivery.

## Verification

- New unit tests must first fail for bad content type, excess declared body size, Vercel client-IP selection, log redaction, and deterministic message IDs.
- New E2E coverage must observe all global security headers and preserve the form journey.
- Run unit tests, lint, production build, E2E tests, and `pnpm audit --json` after the dependency update. The selected Supabase release must support Node 20.9+.
- Inspect migration SQL locally for the private bucket definition, function grants, and `search_path = ''`; do not execute it against any database.
- Manually verify after any later deployment that Vercel Firewall rate limiting and production environment allowlists are configured, and that Supabase dashboard RLS/storage state matches migrations.
