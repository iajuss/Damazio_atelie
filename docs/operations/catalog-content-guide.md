# Guia de conteúdo e publicação do catálogo

Este guia orienta a publicação no catálogo consultivo da Damazio Atelier. O site apresenta inspirações e inicia solicitações de orçamento; não publica preço, pagamento, carrinho, checkout, conta de cliente, prazo fixo ou promessa de resposta automática.

## Antes de publicar

- A pessoa responsável pelo catálogo deve ter acesso individual e autorizado ao painel do Supabase. Não compartilhar credenciais, nem usar a chave `SUPABASE_SERVICE_ROLE_KEY` no navegador.
- Confirmar que a linha está entre as quatro aprovadas: Bordados em roupas, Enxovais e toalhas, Bolsas de crochê, ou Presentes e embalagens.
- Confirmar que a peça pode receber novas solicitações. O status comunica capacidade de atendimento, não estoque unitário.
- Usar somente imagens web aprovadas, em HTTPS, sem marca-d'água. As imagens atuais com marca-d'água são provisórias e bloqueiam o lançamento.
- Revisar toda a cópia voltada ao público em português brasileiro, com tom acolhedor e sem afirmar valores, prazo de produção, prazo de resposta ou frete fixo.

## Preparar imagens

1. Partir do arquivo-fonte sem marca-d'água e sem texto aplicado sobre a peça.
2. Exportar uma versão WebP ou JPEG otimizada, com pelo menos 1600 px no lado maior, perfil sRGB e boa nitidez do acabamento.
3. Usar imagem em HTTPS hospedada no repositório de mídia aprovado; não usar caminhos locais, links temporários ou arquivos de referência enviados por clientes.
4. Criar texto alternativo descritivo e objetivo, por exemplo: “Toalha azul com nome bordado em linha branca”. Não usar “imagem de”, não repetir palavras-chave e não prometer resultado idêntico.
5. Verificar em celular se o corte ainda mostra a peça e se não há marca-d'água, etiqueta de terceiros, dados pessoais ou imagem sem autorização.

## Campos de uma linha

Para cada linha, preencher slug estável, nome, descrição curta, imagem de capa, ordem e publicação. As quatro linhas devem estar publicadas para o lançamento. A capa serve de convite editorial; a descrição explica possibilidades, sem preço ou prazo.

## Campos de um produto

Cada produto é uma inspiração publicável dentro de uma linha, não uma unidade em estoque. Preencher:

- título, slug, descrição e materiais reais;
- disponibilidade (`disponível`, `capacidade limitada` ou `indisponível`);
- pelo menos uma mídia, com texto alternativo, ordem e uma imagem marcada como destaque;
- opções de personalização aplicáveis, ordenadas e compreensíveis;
- publicação somente após a revisão de conteúdo e imagem.

Para uma pergunta de personalização, escolha `texto`, `texto longo` ou `seleção`. Perguntas de seleção precisam de opções reais. Marque como obrigatório apenas o que é necessário para avaliar a solicitação. Exemplos: “Nome ou iniciais”, “Cor desejada” e “Mensagem para cartão”. Não pedir senha, documento, endereço completo ou informação que não ajude ao orçamento.

## Disponibilidade

| Status | Uso no catálogo | Ação operacional |
|---|---|---|
| Disponível | Aceita novas solicitações. | Acompanhar a fila e atualizar quando a capacidade mudar. |
| Capacidade limitada | Aceita solicitações, com aviso de capacidade. | Avaliar cada caso pelo WhatsApp antes de confirmar prazo. |
| Indisponível | Não aceita o formulário. | Informar a condição e manter contato pelo WhatsApp como alternativa. |

Não prometer reposição, prazo de retorno ou capacidade futura no texto público.

## Publicação segura no staging

O script `pnpm seed:catalog` lê um JSON local aprovado indicado por `CATALOG_SEED_FILE`. Sem confirmação, ele apenas valida o arquivo e não acessa nem altera o Supabase. O arquivo não deve entrar no repositório se contiver mídia ainda não aprovada.

O dry-run exige um catálogo completo com as quatro linhas, um exemplar disponível por linha, textos alternativos e mídia marcada explicitamente como aprovada. Para qualquer escrita remota, são necessários, ao mesmo tempo: `CATALOG_SEED_APPLY=true`, `CATALOG_SEED_TARGET=staging`, `CATALOG_SEED_ALLOW_WRITE=true`, `CATALOG_SEED_ALLOW_REMOTE_STAGING=true`, `CATALOG_SEED_STAGING_URL` com a allowlist HTTPS real de staging e `CATALOG_SEED_CONFIRM_URL` idêntica à allowlist. Produção é bloqueada no código.

A chave de serviço é lida somente pelo processo local do script, depois de todas as confirmações, e nunca deve ser adicionada a `.env.example`, ao Git ou ao código de cliente. O script é para o primeiro carregamento de um staging vazio: ele recusa qualquer catálogo já existente, grava todas as dependências sem publicação e só publica ao final. A atualização de conteúdo existente exige revisão manual no painel autorizado; o script não exclui nem reconcilia dados.

## Revisão antes de tornar público

- Confirmar a linha, produto e URL de cada imagem no ambiente correto.
- Abrir a página do produto em celular e desktop; verificar imagem, texto alternativo, materiais e CTA “Solicitar orçamento”.
- Enviar uma solicitação de ensaio somente com autorização explícita e verificar que o código é gerado.
- Confirmar que o produto indisponível não abre formulário.
- Registrar quem revisou conteúdo, imagens e disponibilidade, com data e ambiente.
