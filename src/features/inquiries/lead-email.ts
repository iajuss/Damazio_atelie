import 'server-only';

import nodemailer from 'nodemailer';

export type LeadNotificationPayload = {
  requestCode: string;
  requestKind: 'product' | 'custom';
  productName: string | null;
  name: string;
  contact: string;
  city: string;
  state: string;
  occasion: string | null;
  description: string | null;
  answers: Record<string, string>;
  attachments: Array<{ filename: string; mimeType: string; byteSize: number }>;
};

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

function attachmentLines(attachments: LeadNotificationPayload['attachments']): string[] {
  return attachments.length > 0
    ? attachments.map(({ filename, mimeType, byteSize }) => `- ${filename} (${mimeType}, ${byteSize} bytes)`)
    : ['- Nenhuma referência visual.'];
}

export function buildLeadEmail(payload: LeadNotificationPayload, config: LeadEmailConfig = getLeadEmailConfig()) {
  const context = payload.requestKind === 'product'
    ? `Produto: ${payload.productName ?? 'Produto não identificado'}`
    : 'Criação livre: a pessoa quer criar uma peça a partir da própria ideia.';
  const text = [
    `Protocolo: ${payload.requestCode}`,
    '',
    context,
    `Nome: ${payload.name}`,
    `Contato: ${payload.contact}`,
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
    ...(emailPattern.test(payload.contact) ? { replyTo: payload.contact } : {}),
  };
}

export async function sendLeadEmail(payload: LeadNotificationPayload, config: LeadEmailConfig = getLeadEmailConfig()): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user: config.smtpUser, pass: config.smtpAppPassword },
  });

  await transporter.sendMail(buildLeadEmail(payload, config));
}
