// @vitest-environment node

import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
import { deliverLeadNotifications, type NotificationRepository } from '@/features/inquiries/lead-notifications';
import type { LeadNotificationPayload } from '@/features/inquiries/lead-email';

const payload: LeadNotificationPayload = {
  requestCode: 'AB12CD34EF56GH78IJ90', requestKind: 'custom', productName: null,
  name: 'Ana', contact: 'ana@example.com', city: 'São Paulo', state: 'SP', occasion: null,
  description: 'Uma bolsa bordada.', answers: {}, attachments: [],
};

function repository(rows: Array<{ id: string; payload: LeadNotificationPayload }>): NotificationRepository & { claimed: number; sent: string[]; retried: string[] } {
  return {
    claimed: 0,
    sent: [],
    retried: [],
    async claim() { this.claimed += 1; return rows; },
    async markSent(id) { this.sent.push(id); },
    async reschedule(id) { this.retried.push(id); },
  };
}

afterEach(() => vi.unstubAllEnvs());

describe('entrega de notificações de lead', () => {
  it('confirma cada mensagem enviada na fila', async () => {
    const queue = repository([{ id: 'notification-1', payload }]);
    const delivered: string[] = [];

    await deliverLeadNotifications({ requestCode: payload.requestCode, limit: 1 }, {
      repository: queue,
      sender: async (message) => { delivered.push(message.requestCode); },
    });

    expect(delivered).toEqual([payload.requestCode]);
    expect(queue.sent).toEqual(['notification-1']);
    expect(queue.retried).toEqual([]);
  });

  it('reagenda apenas a mensagem que falhar e continua as demais', async () => {
    const queue = repository([{ id: 'notification-1', payload }, { id: 'notification-2', payload: { ...payload, requestCode: 'ZX98CV76BN54ML32KJ10' } }]);
    const delivered: string[] = [];

    await deliverLeadNotifications({ limit: 2 }, {
      repository: queue,
      sender: async (message) => {
        if (message.requestCode === payload.requestCode) throw new Error('SMTP indisponível');
        delivered.push(message.requestCode);
      },
    });

    expect(queue.retried).toEqual(['notification-1']);
    expect(queue.sent).toEqual(['notification-2']);
    expect(delivered).toEqual(['ZX98CV76BN54ML32KJ10']);
  });

  it('não reserva mensagens quando a configuração de e-mail está ausente', async () => {
    vi.stubEnv('GMAIL_SMTP_USER', '');
    vi.stubEnv('GMAIL_SMTP_APP_PASSWORD', '');
    vi.stubEnv('GMAIL_SMTP_FROM', '');
    vi.stubEnv('LEAD_NOTIFICATION_TO', '');
    const queue = repository([{ id: 'notification-1', payload }]);

    await expect(deliverLeadNotifications({}, { repository: queue })).rejects.toThrow('Configuração de e-mail ausente.');

    expect(queue.claimed).toBe(0);
  });
});
