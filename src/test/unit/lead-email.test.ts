// @vitest-environment node

import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
import { buildLeadEmail, getLeadEmailConfig, type LeadNotificationPayload } from '@/features/inquiries/lead-email';

const payload: LeadNotificationPayload = {
  requestCode: 'AB12CD34EF56GH78IJ90',
  requestKind: 'product',
  productName: 'Toalha bordada',
  name: 'Ana',
  contact: 'ana@example.com',
  city: 'São Paulo',
  state: 'SP',
  occasion: 'Presente',
  description: 'Quero uma toalha azul.',
  answers: { nome: 'Ana' },
  attachments: [{ filename: 'referencia.png', mimeType: 'image/png', byteSize: 8 }],
};

afterEach(() => vi.unstubAllEnvs());

describe('e-mail de lead', () => {
  it('prepara o e-mail de uma solicitação sem incluir caminho privado de arquivo', () => {
    vi.stubEnv('GMAIL_SMTP_USER', 'damazioatelier@gmail.com');
    vi.stubEnv('GMAIL_SMTP_APP_PASSWORD', 'app-password');
    vi.stubEnv('GMAIL_SMTP_FROM', 'Damazio Atelier <damazioatelier@gmail.com>');
    vi.stubEnv('LEAD_NOTIFICATION_TO', 'damazioatelier@gmail.com');

    const email = buildLeadEmail(payload);

    expect(email).toMatchObject({
      to: 'damazioatelier@gmail.com',
      subject: '[Damazio] Nova solicitação AB12CD34EF56GH78IJ90',
      text: expect.stringContaining('Ana'),
      replyTo: 'ana@example.com',
    });
    expect(email.text).toContain('referencia.png');
    expect(email.text).not.toContain('private-file.png');
  });

  it('exige todas as credenciais do Gmail apenas no servidor', () => {
    vi.stubEnv('GMAIL_SMTP_USER', '');
    vi.stubEnv('GMAIL_SMTP_APP_PASSWORD', '');
    vi.stubEnv('GMAIL_SMTP_FROM', '');
    vi.stubEnv('LEAD_NOTIFICATION_TO', '');

    expect(() => getLeadEmailConfig()).toThrow('Configuração de e-mail ausente.');
  });
});
