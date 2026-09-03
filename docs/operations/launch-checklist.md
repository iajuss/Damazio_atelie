# Checklist de lançamento

Use esta lista como evidência de lançamento. Nenhuma etapa externa deve ser executada sem autorização explícita da Damazio Atelier.

## Bloqueadores obrigatórios

- [ ] Substituir todas as imagens atuais com marca-d'água por imagens web aprovadas, em HTTPS e sem marca-d'água.
- [ ] Definir e testar a URL HTTPS final em `NEXT_PUBLIC_SITE_URL`.
- [ ] Definir origens confiáveis reais em `INQUIRY_ALLOWED_ORIGINS`; remover `localhost` da configuração de produção.
- [ ] Confirmar revisão jurídica da política, termos e dados reais do responsável pelo tratamento (nome/razão social, CNPJ quando aplicável, endereço e canal de titulares).
- [ ] Confirmar o perfil oficial do Instagram: `https://www.instagram.com/damazio.atelier/`.

## Conteúdo e catálogo

- [ ] Publicar as quatro linhas aprovadas, com pelo menos um exemplar disponível por linha.
- [ ] Revisar título, descrição, materiais, disponibilidade, CTA, textos alternativos e campos de personalização de cada exemplar.
- [ ] Confirmar que não há preço, pagamento, carrinho, checkout, conta de cliente, prazo fixo ou resposta automática em páginas públicas.
- [ ] Conferir que produtos indisponíveis não iniciam formulário.
- [ ] Registrar revisora, data e ambiente de cada aprovação de conteúdo.

## Infraestrutura externa — executar somente quando autorizado

- [ ] Vercel: apontar o domínio somente após autorização; confirmar certificado HTTPS válido, URL canônica, variáveis de ambiente e resposta da rota inicial. Registrar URL e data.
- [ ] Vercel: configurar variáveis apenas no ambiente correto; verificar que `SUPABASE_SERVICE_ROLE_KEY` não aparece no bundle, no navegador ou em logs públicos.
- [ ] Supabase: aplicar migrações no projeto autorizado e confirmar que `inquiry-references` é privado.
- [ ] Supabase: com uma sessão anônima, tentar listar referências e registrar a negativa; com operador autorizado, confirmar a consulta de uma solicitação de ensaio.
- [ ] Supabase: revisar acesso individual ao painel, RLS, backups, monitoramento, alertas e política de retenção. Não alterar esses recursos sem autorização.
- [ ] Configurar os contatos operacionais para acesso a falhas e solicitações, quando a Damazio aprovar o mecanismo de monitoramento.

## Ensaios verificáveis

1. Executar a validação local do catálogo com `CATALOG_SEED_FILE` apontando para o JSON aprovado e `pnpm seed:catalog`. O resultado deve dizer “Dry-run concluído” e não realizar escrita.
2. Depois de autorização explícita para staging, preencher as seis confirmações descritas no guia de catálogo, incluindo a allowlist `CATALOG_SEED_STAGING_URL`, e executar o seed em um staging vazio. Conferir linhas, produtos, imagens e campos no painel de staging.
3. Configurar `LAUNCH_SMOKE_BASE_URL` com a URL HTTPS de staging, `LAUNCH_SMOKE_TARGET=staging`, `LAUNCH_SMOKE_CONFIRM_URL` com a mesma URL e `LAUNCH_SMOKE_ALLOW_REMOTE_STAGING=true`. Definir também `LAUNCH_SMOKE_PRODUCT_SLUG` com um produto publicado, `LAUNCH_SMOKE_SUPABASE_URL` e uma chave anônima válida de staging para testar o bucket privado.
4. Executar `pnpm playwright test src/test/e2e/launch-smoke.spec.ts`. O ensaio de escrita fica bloqueado até `LAUNCH_SMOKE_ALLOW_WRITE=true`; só habilitá-lo com autorização explícita para criar uma solicitação de ensaio.
5. Em celular e desktop, seguir produto → “Solicitar orçamento” → envio autorizado → código → “Abrir Instagram”. Confirmar que o destino é o perfil oficial.

## Qualidade e limitações

- [ ] Executar `pnpm lint`, `pnpm vitest run`, `pnpm build` e `pnpm playwright test` no commit candidato.
- [ ] Executar Lighthouse no URL HTTPS de staging em viewport móvel. Registrar desempenho, acessibilidade, boas práticas e SEO; não há resultado válido sem ambiente HTTPS disponível.
- [ ] Fazer revisão visual em 320 px, tablet e desktop, verificando foco, texto alternativo, ausência de rolagem horizontal e legibilidade.
- [ ] Anexar ou registrar os resultados, ambiente, data e pessoa responsável antes de aprovar lançamento.

## Decisão de lançamento

Não lançar enquanto houver um bloqueador obrigatório, smoke remoto não executado sem justificativa registrada, imagens provisórias ou revisão jurídica pendente. Este checklist documenta passos externos; ele não autoriza deploy, publicação, alteração de domínio, Vercel, Supabase remoto, backups, monitoramento ou dados reais.
