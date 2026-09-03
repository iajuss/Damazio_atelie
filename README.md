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

Copie `.env.example` para um arquivo de ambiente local e preencha os valores do projeto Supabase. Em produção, `NEXT_PUBLIC_SITE_URL` também deve conter o URL público canônico, com `https`. As variáveis necessárias são `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` e `SUPABASE_SERVICE_ROLE_KEY`.

As duas variáveis `NEXT_PUBLIC_` compõem o acesso público restrito por RLS. `SUPABASE_SERVICE_ROLE_KEY` é exclusiva do servidor para processar solicitações e anexos privados; nunca a use em componentes, código de navegador ou arquivos versionados.

As migrações em `supabase/migrations` criam o catálogo público, as solicitações privadas e o bucket privado `inquiry-references`. Este MVP é um catálogo consultivo: não há carrinho, checkout, pagamento, login, área de cliente ou frete automático.

## Pré-requisitos de lançamento

Antes de publicar o site, a Damazio Atelier precisa definir o responsável pelo tratamento de dados, CNPJ, endereço e um canal de contato para titulares. A política de privacidade e os termos de uso também precisam passar por revisão jurídica adequada. Esses dados não foram presumidos nem inseridos no código.

Confirme ainda que `NEXT_PUBLIC_SITE_URL` aponta para o domínio público definitivo, que as credenciais do Supabase estão configuradas somente no ambiente e que o bucket `inquiry-references` continua privado.

## Verificações

```bash
pnpm lint
pnpm vitest run
pnpm build
pnpm playwright test src/test/e2e/home.spec.ts
```
