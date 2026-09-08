# Confirmação ao cliente e endereço completo na solicitação

## Objetivo

Transformar a solicitação em um lead mais completo e confirmável: coletar telefone, e-mail e endereço, preencher o máximo possível a partir do CEP e enviar uma confirmação por e-mail com o protocolo gerado.

## Experiência do formulário

O formulário substituirá os campos genéricos `Contato`, `Cidade` e `UF` por:

- nome;
- telefone;
- e-mail;
- CEP;
- rua/logradouro;
- número;
- complemento opcional;
- bairro;
- cidade;
- UF.

Quando o CEP tiver oito dígitos, o cliente consultará um endpoint interno que usa ViaCEP. Logradouro, bairro, cidade e UF serão preenchidos quando estiverem disponíveis, mas continuarão editáveis. Número é sempre preenchido pela pessoa. Se o serviço estiver indisponível ou o CEP não existir, o formulário exibirá uma mensagem curta e permitirá o preenchimento manual dos mesmos campos.

Telefone, e-mail, CEP, rua, número, bairro, cidade e UF serão obrigatórios. Complemento permanece opcional. O servidor repete todas as validações; o preenchimento automático nunca é requisito de envio.

## Dados e compatibilidade

Uma migração aditiva incluirá em `inquiries` os campos `email`, `phone`, `postal_code`, `street`, `address_number`, `complement` e `neighborhood`. As colunas legadas `contact`, `city` e `state` serão preservadas, mantendo pedidos antigos legíveis; novos pedidos continuarão armazenando cidade e UF nelas para compatibilidade.

Uma nova função RPC será criada para o formulário novo, sem substituir a RPC já usada pela versão anterior do site. Isso permite aplicar a migração antes ou depois de um deploy sem interromper solicitações em trânsito.

## E-mails confiáveis

Cada solicitação nova criará atomicamente duas mensagens na fila privada:

1. **Atelier:** o lead completo, com telefone, e-mail e endereço.
2. **Cliente:** uma confirmação concisa com nome e protocolo em destaque; não repete endereço ou anexos por e-mail.

A fila receberá um tipo de destinatário e uma chave única por solicitação e destinatário. Cada mensagem é entregue e reagendada de forma independente; falhar a confirmação não reenvia o lead para a Damazio, e vice-versa. Mensagens de pedidos antigos continuarão sendo tratadas como notificações do Atelier.

As mensagens usarão a configuração Gmail SMTP existente. O e-mail da cliente será validado antes de persistir a solicitação.

## Privacidade e erros

A política de privacidade será atualizada para informar a coleta de telefone, e-mail e endereço para atender, entregar e responder solicitações. O endpoint de CEP recebe apenas oito dígitos, não registra a resposta e não armazena dados até o envio do formulário.

Falhas de ViaCEP deixam o formulário utilizável manualmente. Falhas temporárias de SMTP são recuperadas pela fila e pelo cron já existente, sem fazer o navegador perder um pedido persistido.

## Verificação

Testes unitários cobrirão a validação de telefone, e-mail e endereço, a composição das duas mensagens, o retorno do CEP e a entrega independente da fila. Testes de interface cobrirão o preenchimento automático e a recuperação manual. A suíte completa, lint e build serão executados antes da integração.
