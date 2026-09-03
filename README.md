# Damazio Atelier

Catálogo consultivo do Damazio Atelier, desenvolvido com Next.js, TypeScript e Tailwind CSS.

## Requisitos

- Node.js 20.9 ou superior
- pnpm

## Desenvolvimento

```bash
pnpm install
pnpm dev
```

## Ambiente

Copie `.env.example` para um arquivo de ambiente local e preencha somente os valores do projeto Supabase. As variáveis necessárias são `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` e `SUPABASE_SERVICE_ROLE_KEY`.

As duas variáveis `NEXT_PUBLIC_` compõem o acesso público restrito por RLS. `SUPABASE_SERVICE_ROLE_KEY` é exclusiva do servidor para processar solicitações e anexos privados; nunca a use em componentes, código de navegador ou arquivos versionados.

As migrações em `supabase/migrations` criam o catálogo público, as solicitações privadas e o bucket privado `inquiry-references`. Este MVP é um catálogo consultivo: não há carrinho, checkout, pagamento, login, área de cliente ou frete automático.

## Verificações

```bash
pnpm lint
pnpm vitest run
pnpm build
pnpm playwright test src/test/e2e/home.spec.ts
```
