// @vitest-environment node

import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
import { buildLeadEmail, getLeadEmailConfig, type AtelierNotificationPayload, type CustomerNotificationPayload } from '@/features/inquiries/lead-email';

const atelierPayload: AtelierNotificationPayload = {
  requestCode: 'AB12CD34EF56GH78IJ90',
  requestKind: 'product',
  productName: 'Toalha bordada',
  name: 'Ana',
  contact: 'ana@example.com',
  email: 'ana@example.com',
  phone: '11999999999',
  postalCode: '01001000',
  street: 'Praça da Sé',
  addressNumber: '1',
  complement: 'Sala 2',
  neighborhood: 'Sé',
  city: 'São Paulo',
  state: 'SP',
  occasion: 'Presente',
  description: 'Quero uma toalha azul.',
  answers: { nome: 'Ana' },
  attachments: [{ filename: 'referencia.png', mimeType: 'image/png', byteSize: 8 }],
};

const customerPayload: CustomerNotificationPayload = {
  requestCode: 'AB12CD34EF56GH78IJ90', name: 'Ana', email: 'ana@example.com',
};

afterEach(() => vi.unstubAllEnvs());

describe('e-mail de lead', () => {
  it('prepara o e-mail completo do ateliê sem incluir caminho privado de arquivo', () => {
    vi.stubEnv('GMAIL_SMTP_USER', 'damazioatelier@gmail.com');
    vi.stubEnv('GMAIL_SMTP_APP_PASSWORD', 'app-password');
    vi.stubEnv('GMAIL_SMTP_FROM', 'Damazio Atelier <damazioatelier@gmail.com>');
    vi.stubEnv('LEAD_NOTIFICATION_TO', 'damazioatelier@gmail.com');

    const email = buildLeadEmail({ recipientKind: 'atelier', payload: atelierPayload });

    expect(email).toMatchObject({
      to: 'damazioatelier@gmail.com',
      subject: '[Damazio] Nova solicitação AB12CD34EF56GH78IJ90',
      text: expect.stringContaining('Ana'),
      replyTo: 'ana@example.com',
    });
    expect(email.text).toContain('referencia.png');
    expect(email.text).not.toContain('private-file.png');
    expect(email.text).toContain('Telefone: 11999999999');
    expect(email.text).toContain('Endereço: Praça da Sé, 1 - Sala 2');
  });

  it('envia confirmação mínima exclusivamente ao e-mail da cliente, com o protocolo', () => {
    vi.stubEnv('GMAIL_SMTP_USER', 'damazioatelier@gmail.com');
    vi.stubEnv('GMAIL_SMTP_APP_PASSWORD', 'app-password');
    vi.stubEnv('GMAIL_SMTP_FROM', 'Damazio Atelier <damazioatelier@gmail.com>');
    vi.stubEnv('LEAD_NOTIFICATION_TO', 'atendimento@damazio.example');

    const email = buildLeadEmail({ recipientKind: 'customer', payload: customerPayload });

    expect(email).toMatchObject({
      from: 'Damazio Atelier <damazioatelier@gmail.com>',
      to: 'ana@example.com',
      subject: '[Damazio] Recebemos sua solicitação AB12CD34EF56GH78IJ90',
    });
    expect(email).not.toHaveProperty('replyTo');
    expect(email.text).toContain('AB12CD34EF56GH78IJ90');
    for (const forbidden of ['11999999999', 'Praça da Sé', 'Sala 2', 'Presente', 'toalha azul', 'referencia.png', 'atendimento@damazio.example']) {
      expect(email.text).not.toContain(forbidden);
    }
  });

  it('exige todas as credenciais do Gmail apenas no servidor', () => {
    vi.stubEnv('GMAIL_SMTP_USER', '');
    vi.stubEnv('GMAIL_SMTP_APP_PASSWORD', '');
    vi.stubEnv('GMAIL_SMTP_FROM', '');
    vi.stubEnv('LEAD_NOTIFICATION_TO', '');

    expect(() => getLeadEmailConfig()).toThrow('Configuração de e-mail ausente.');
  });
});
