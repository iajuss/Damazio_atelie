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
const safeRequestCodePattern = /^[A-Za-z0-9-]+$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requiredText(record: Record<string, unknown>, key: string): string | null {
  const value = record[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function optionalText(record: Record<string, unknown>, key: string): string | undefined {
  if (!(key in record)) return '';
  const value = record[key];
  return typeof value === 'string' ? value : undefined;
}

function nullableText(record: Record<string, unknown>, key: string): string | null | undefined {
  if (!(key in record) || record[key] === null) return null;
  return typeof record[key] === 'string' ? record[key] : undefined;
}

function normalizedRequestCode(record: Record<string, unknown>): string | null {
  const requestCode = requiredText(record, 'requestCode');
  return requestCode && safeRequestCodePattern.test(requestCode) ? requestCode : null;
}

function normalizeAnswers(value: unknown): Record<string, string> | null {
  if (!isRecord(value)) return null;
  const entries = Object.entries(value);
  if (entries.some(([key, answer]) => !key || typeof answer !== 'string')) return null;
  return Object.fromEntries(entries) as Record<string, string>;
}

function normalizeAttachments(value: unknown): AtelierNotificationPayload['attachments'] | null {
  if (!Array.isArray(value)) return null;
  const attachments: AtelierNotificationPayload['attachments'] = [];
  for (const item of value) {
    if (!isRecord(item) || typeof item.filename !== 'string' || typeof item.mimeType !== 'string'
      || typeof item.byteSize !== 'number' || !Number.isSafeInteger(item.byteSize) || item.byteSize < 0) return null;
    attachments.push({ filename: item.filename, mimeType: item.mimeType, byteSize: item.byteSize });
  }
  return attachments;
}

function normalizeAtelierPayload(value: unknown): AtelierNotificationPayload | null {
  if (!isRecord(value)) return null;
  const requestCode = normalizedRequestCode(value);
  const name = requiredText(value, 'name');
  const contact = requiredText(value, 'contact');
  const city = requiredText(value, 'city');
  const state = requiredText(value, 'state');
  const requestKind = value.requestKind;
  const productName = nullableText(value, 'productName');
  const occasion = nullableText(value, 'occasion');
  const description = nullableText(value, 'description');
  const email = optionalText(value, 'email');
  const phone = optionalText(value, 'phone');
  const postalCode = optionalText(value, 'postalCode');
  const street = optionalText(value, 'street');
  const addressNumber = optionalText(value, 'addressNumber');
  const complement = optionalText(value, 'complement');
  const neighborhood = optionalText(value, 'neighborhood');
  const answers = normalizeAnswers(value.answers);
  const attachments = normalizeAttachments(value.attachments);
  if (!requestCode || !name || !contact || !city || !state || (requestKind !== 'product' && requestKind !== 'custom')
    || productName === undefined || occasion === undefined || description === undefined
    || email === undefined || phone === undefined || postalCode === undefined || street === undefined
    || addressNumber === undefined || complement === undefined || neighborhood === undefined || !answers || !attachments) return null;

  return {
    requestCode, requestKind, productName, name, contact,
    email: email || (emailPattern.test(contact) ? contact : ''), phone, postalCode, street, addressNumber, complement, neighborhood,
    city, state, occasion, description, answers, attachments,
  };
}

function normalizeCustomerPayload(value: unknown): CustomerNotificationPayload | null {
  if (!isRecord(value)) return null;
  const requestCode = normalizedRequestCode(value);
  const name = requiredText(value, 'name');
  const email = requiredText(value, 'email');
  return requestCode && name && email && emailPattern.test(email) ? { requestCode, name, email } : null;
}

export function parseQueuedLeadNotification(recipientKind: unknown, payload: unknown): QueuedLeadNotification | null {
  if (recipientKind === 'atelier') {
    const normalized = normalizeAtelierPayload(payload);
    return normalized ? { recipientKind, payload: normalized } : null;
  }
  if (recipientKind === 'customer') {
    const normalized = normalizeCustomerPayload(payload);
    return normalized ? { recipientKind, payload: normalized } : null;
  }
  return null;
}

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
