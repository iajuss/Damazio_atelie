# Entrega confiável de leads e publicação

## Objetivo

Transformar a solicitação em um fluxo de captação confiável: cada envio deve ser preservado no Supabase e gerar uma notificação para `damazioatelier@gmail.com`. A pessoa também deve poder continuar o atendimento pelo Direct antes de concluir o formulário. A publicação será preparada para Vercel com Gmail SMTP, sem expor credenciais.

## Experiência

- O card dourado `Crie a sua peça` centraliza vertical e horizontalmente seu conteúdo, preservando textura, contraste e área inteira clicável.
- O formulário exibe duas ações distintas: `Enviar solicitação` envia e registra o lead; `Continuar pelo Direct` abre o perfil oficial da Damazio em uma nova aba. O Direct não substitui o envio e não promete transportar automaticamente arquivos ou texto para o Instagram.
- A confirmação aparece depois que o lead foi registrado. Uma indisponibilidade temporária do Gmail não deve apagar nem rejeitar um lead já registrado.

## Fonte de verdade e entrega de e-mail

O Supabase continuará sendo a fonte de verdade privada. A escrita do pedido e a criação de um item de caixa de saída acontecem na mesma operação de banco.

- A migração cria uma tabela privada de notificações vinculada à solicitação, com estado (`pending`, `sending`, `sent`, `failed`), número de tentativas, última falha e horários de criação/envio.
- A rotina de criação de solicitação insere o pedido, anexos e uma notificação pendente atomically. Assim, um problema SMTP não perde os dados do contato.
- Um módulo exclusivamente de servidor usa SMTP do Gmail (`smtp.gmail.com`, TLS) e uma senha de app para montar um e-mail textual com protocolo, dados de contato, peça ou criação livre, respostas, descrição e indicação de anexos privados. O remetente e destinatário são o e-mail oficial da Damazio; o campo `Reply-To` usa o contato informado somente quando for um e-mail válido.
- A rota de solicitação tenta entregar imediatamente a notificação depois da persistência. A marcação como enviada só acontece após o sucesso do SMTP. Caso haja erro, responde com sucesso ao visitante, deixa a notificação pendente e registra uma falha sanitizada para nova tentativa.
- Uma rota interna protegida processa itens pendentes em lotes pequenos e limita tentativas. Ela é acionada pelo cron da Vercel para recuperar notificações falhas. A entrega tem semântica de pelo-menos-uma-vez: em um timeout raro, uma notificação pode ser reenviada, mas nenhum lead é descartado.

## Segurança e privacidade

- As variáveis `GMAIL_SMTP_USER`, `GMAIL_SMTP_APP_PASSWORD`, `GMAIL_SMTP_FROM`, `LEAD_NOTIFICATION_TO` e `CRON_SECRET` são somente de servidor; não recebem prefixo `NEXT_PUBLIC_`, não entram em arquivos versionados e não são exibidas ao navegador.
- A senha de app será criada pelo titular da conta com verificação em duas etapas ativa e cadastrada manualmente no painel da Vercel. Ela não deve ser enviada por chat, commit ou formulário.
- O envio por e-mail é uma comunicação operacional para responder a uma solicitação autorizada. A política de privacidade será atualizada para informar que dados podem ser processados pelo Gmail para esse atendimento, enquanto referências visuais permanecem privadas no Supabase.
- As APIs atuais de origem confiável, honeypot, limite de requisições, validação e arquivos privados permanecem em vigor. A rota de reprocessamento aceita apenas a autorização Bearer baseada em `CRON_SECRET`.

## Publicação na Vercel

- O projeto será configurado para deploy a partir da branch principal, com Preview separado de Production. Preview não recebe credenciais SMTP reais e não dispara e-mails para clientes.
- Production recebe as variáveis atuais do Supabase, URL canônica HTTPS, origens permitidas e as variáveis SMTP/cron. As credenciais são cadastradas no painel, não por URL ou Git.
- `vercel.json` agenda a recuperação de notificações. Em Vercel Hobby a frequência mínima é diária; para recuperação em minutos, a operação precisa de Vercel Pro. A primeira tentativa permanece imediata, portanto o plano afeta apenas a recuperação automática após falhas.
- O checklist de lançamento inclui: migrações aplicadas, bucket privado confirmado, origem e URL final configuradas, envio de teste para a caixa oficial, confirmação de que nenhum Preview dispara e-mail real, e verificação da rota cron nos logs da Vercel.

## Testes

- Testes unitários para composição segura de e-mail, ausência de segredos no cliente, transições da caixa de saída e falhas SMTP.
- Testes de serviço para criação atômica do pedido e notificação, marcação de sucesso, reprocessamento e preservação do lead em falhas.
- Testes de API para e-mail imediato, cron protegido e respostas sem dados privados.
- Testes de interface e E2E para o card centralizado e o novo botão de Direct.
- Build, lint, suíte unitária e E2E locais antes da publicação; teste de fumaça em Preview antes de promover para Production.
