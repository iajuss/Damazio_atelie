import 'server-only';

import nodemailer from 'nodemailer';

export type AtelierNotificationPayload = {
  requestCode: string;
  requestKind: 'product' | 'custom';
  productName: string | null;
  name: string;
  contact: string;
  email: string;
  phone: string;
  postalCode: string;
  street: string;
  addressNumber: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  occasion: string | null;
  description: string | null;
  answers: Record<string, string>;
  attachments: Array<{ filename: string; mimeType: string; byteSize: number }>;
};

export type CustomerNotificationPayload = {
  requestCode: string;
  name: string;
  email: string;
};

export type QueuedLeadNotification =
  | { recipientKind: 'atelier'; payload: AtelierNotificationPayload }
  | { recipientKind: 'customer'; payload: CustomerNotificationPayload };

export type LeadEmailConfig = {
  smtpUser: string;
  smtpAppPassword: string;
  from: string;
  to: string;
};

type MailEnvironment = Record<string, string | undefined>;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function requiredValue(environment: MailEnvironment, name: keyof MailEnvironment): string {
  const value = environment[name]?.trim();
  if (!value) throw new Error('Configuração de e-mail ausente.');
  return value;
}

export function getLeadEmailConfig(environment: MailEnvironment = process.env): LeadEmailConfig {
  return {
    smtpUser: requiredValue(environment, 'GMAIL_SMTP_USER'),
    smtpAppPassword: requiredValue(environment, 'GMAIL_SMTP_APP_PASSWORD'),
    from: requiredValue(environment, 'GMAIL_SMTP_FROM'),
    to: requiredValue(environment, 'LEAD_NOTIFICATION_TO'),
  };
}

function answerLines(answers: Record<string, string>): string[] {
  const entries = Object.entries(answers);
  return entries.length > 0 ? entries.map(([key, value]) => `- ${key}: ${value}`) : ['- Nenhuma resposta adicional.'];
}

function attachmentLines(attachments: AtelierNotificationPayload['attachments']): string[] {
  return attachments.length > 0
    ? attachments.map(({ filename, mimeType, byteSize }) => `- ${filename} (${mimeType}, ${byteSize} bytes)`)
    : ['- Nenhuma referência visual.'];
}

function fullAddress(payload: AtelierNotificationPayload): string {
  return `${payload.street}, ${payload.addressNumber}${payload.complement ? ` - ${payload.complement}` : ''}`;
}

export function buildLeadEmail(notification: QueuedLeadNotification, config: LeadEmailConfig = getLeadEmailConfig()) {
  if (notification.recipientKind === 'customer') {
    const { payload } = notification;
    return {
      from: config.from,
      to: payload.email,
      subject: `[Damazio] Recebemos sua solicitação ${payload.requestCode}`,
      text: [
        `Olá, ${payload.name}.`,
        '',
        'Recebemos sua solicitação e retornaremos assim que possível.',
        `Protocolo: ${payload.requestCode}`,
        '',
        'Com carinho,',
        'Damazio Atelier',
      ].join('\n'),
    };
  }

  const { payload } = notification;
  const context = payload.requestKind === 'product'
    ? `Produto: ${payload.productName ?? 'Produto não identificado'}`
    : 'Criação livre: a pessoa quer criar uma peça a partir da própria ideia.';
  const text = [
    `Protocolo: ${payload.requestCode}`,
    '',
    context,
    `Nome: ${payload.name}`,
    `E-mail: ${payload.email}`,
    `Telefone: ${payload.phone}`,
    `CEP: ${payload.postalCode}`,
    `Endereço: ${fullAddress(payload)}`,
    `Bairro: ${payload.neighborhood}`,
    `Cidade/UF: ${payload.city}/${payload.state}`,
    `Ocasião: ${payload.occasion ?? 'Não informada'}`,
    '',
    'Descrição:',
    payload.description ?? 'Não informada.',
    '',
    'Personalizações:',
    ...answerLines(payload.answers),
    '',
    'Referências visuais (armazenadas de forma privada no Supabase):',
    ...attachmentLines(payload.attachments),
  ].join('\n');

  return {
    from: config.from,
    to: config.to,
    subject: `[Damazio] Nova solicitação ${payload.requestCode}`,
    text,
    ...(emailPattern.test(payload.email) ? { replyTo: payload.email } : {}),
  };
}

export async function sendLeadEmail(notification: QueuedLeadNotification, config: LeadEmailConfig = getLeadEmailConfig()): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user: config.smtpUser, pass: config.smtpAppPassword },
  });

  await transporter.sendMail(buildLeadEmail(notification, config));
}
