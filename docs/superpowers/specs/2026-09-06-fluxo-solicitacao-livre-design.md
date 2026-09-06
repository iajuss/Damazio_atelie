# Fluxo de solicitação livre e canais de atendimento

## Objetivo

Permitir que uma pessoa inicie uma solicitação de uma criação sem escolher uma inspiração, preservando o protocolo, a privacidade e o atendimento consultivo já usados nas solicitações vinculadas a produtos. A experiência deve seguir a identidade visual editorial do site e oferecer Instagram Direct e e-mail como canais de continuidade.

## Modelo de dados e persistência

As solicitações terão dois tipos: `product` para pedidos associados a uma inspiração e `custom` para criações livres.

- Solicitações `product` mantêm o vínculo obrigatório com o produto, os campos de personalização e todas as validações existentes.
- Solicitações `custom` não têm produto associado. Devem possuir descrição da ideia, nome, contato, cidade, estado, consentimento e podem conter anexos.
- Ambas recebem protocolo, usam o armazenamento privado de anexos e são registradas pela rotina transacional do banco.
- A migração torna o vínculo com produto opcional exclusivamente para `custom`, adiciona o tipo de solicitação e atualiza a função de criação. Índices e restrições devem continuar atendendo consultas por produto quando ele existir.
- A API identifica o tipo explicitamente. Uma solicitação por inspiração não pode omitir ou substituir seu produto; uma criação livre não aceita respostas específicas de campos de produto.

## Rotas e interface

Será criada a rota estática `/solicitar-orcamento` para a criação livre. As rotas atuais `/solicitar-orcamento/[slug]` continuam representando solicitações por inspiração.

- O header mantém `Ver catálogo` e acrescenta `Solicitar sua peça`, apontando para a rota livre.
- O catálogo recebe um card editorial `Crie a sua peça`, sem se apresentar como produto pronto, com chamada para contar uma ideia e CTA para a rota livre.
- As duas variantes de solicitação compartilham uma página editorial: fundo marrom, header coerente com as demais páginas, título em tipografia de destaque e formulário em superfície clara.
- A rota por inspiração mostra a referência selecionada. A rota livre apresenta o contexto `Crie a sua peça` e exige a descrição da ideia.
- O sitemap passa a expor a rota direta de solicitação.

## Canais de atendimento

O e-mail oficial é `damazioatelier@gmail.com`.

- O rodapé mostra o e-mail em todas as páginas.
- A página Contato apresenta e-mail e Instagram como alternativas equivalentes de conversa.
- Após um envio bem-sucedido, a confirmação oferece `Abrir Direct` e `Enviar e-mail`. O link de e-mail abre uma mensagem para o endereço oficial com o protocolo no assunto.

## Tratamento de erros e privacidade

O fluxo livre reutiliza as validações de dados pessoais, origem confiável, limite de envio, tamanho e tipo dos anexos, e consentimento. Erros continuam retornando sem expor dados privados. Os anexos seguem inacessíveis publicamente.

## Testes

- Testes de esquema, serviço e API para criação livre com protocolo e para a preservação das regras de pedidos por inspiração.
- Testes de componente para descrição obrigatória no pedido livre e para as duas ações da confirmação.
- Testes de navegação para o novo botão do header, card do catálogo, rota direta, e-mail no rodapé e página Contato.
- Testes end-to-end de responsividade, acessibilidade e do padrão editorial nas páginas de solicitação.
