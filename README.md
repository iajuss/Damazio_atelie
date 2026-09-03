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

## Operação e lançamento

Os guias operacionais estão em [docs/operations](docs/operations): publicação do catálogo, atendimento pelo Instagram e checklist de lançamento. O catálogo é consultivo: não há preço público, pagamento, carrinho, checkout, conta de cliente ou prazo fixo.

Para validar o conteúdo aprovado sem alterar dados remotos, informe um arquivo JSON local em `CATALOG_SEED_FILE` e execute:

```bash
pnpm seed:catalog
```

O comando faz dry-run por padrão. A escrita é bloqueada em produção e só pode ocorrer em um staging vazio após seis confirmações explícitas, incluindo a allowlist `CATALOG_SEED_STAGING_URL`, descritas em `docs/operations/catalog-content-guide.md`. A chave de serviço é usada apenas pelo processo de linha de comando, nunca pelo navegador.

O smoke remoto também é opt-in: defina uma URL HTTPS de staging e as confirmações `LAUNCH_SMOKE_TARGET=staging`, `LAUNCH_SMOKE_CONFIRM_URL` e `LAUNCH_SMOKE_ALLOW_REMOTE_STAGING=true` antes de executar `pnpm playwright test src/test/e2e/launch-smoke.spec.ts`. A criação de solicitação de ensaio continua bloqueada até `LAUNCH_SMOKE_ALLOW_WRITE=true` e autorização explícita.

As imagens atuais têm marca-d'água e são provisórias. A substituição por imagens web aprovadas sem marca-d'água, a URL HTTPS final, as origens confiáveis reais e a revisão jurídica dos dados do responsável são bloqueadores de lançamento.
