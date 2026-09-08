// @vitest-environment node

import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
import { deliverLeadNotifications, type NotificationRepository } from '@/features/inquiries/lead-notifications';
import type { QueuedLeadNotification } from '@/features/inquiries/lead-email';

const atelierNotification: QueuedLeadNotification = { recipientKind: 'atelier', payload: {
  requestCode: 'AB12CD34EF56GH78IJ90', requestKind: 'custom', productName: null,
  name: 'Ana', contact: 'ana@example.com', email: 'ana@example.com', phone: '11999999999', postalCode: '01001000',
  street: 'Praça da Sé', addressNumber: '1', complement: '', neighborhood: 'Sé', city: 'São Paulo', state: 'SP', occasion: null,
  description: 'Uma bolsa bordada.', answers: {}, attachments: [],
} };

const customerNotification: QueuedLeadNotification = { recipientKind: 'customer', payload: {
  requestCode: 'AB12CD34EF56GH78IJ90', name: 'Ana', email: 'ana@example.com',
} };

type ClaimedNotification = QueuedLeadNotification | { recipientKind: 'unknown'; payload: unknown };

function repository(rows: Array<{ id: string; notification: ClaimedNotification }>): NotificationRepository & { claimed: number; sent: string[]; retried: string[] } {
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
    const queue = repository([{ id: 'notification-1', notification: atelierNotification }]);
    const delivered: string[] = [];

    await deliverLeadNotifications({ requestCode: atelierNotification.payload.requestCode, limit: 1 }, {
      repository: queue,
      sender: async (notification) => { delivered.push(notification.payload.requestCode); },
    });

    expect(delivered).toEqual([atelierNotification.payload.requestCode]);
    expect(queue.sent).toEqual(['notification-1']);
    expect(queue.retried).toEqual([]);
  });

  it('reagenda apenas a confirmação da cliente que falhar e continua o e-mail do ateliê', async () => {
    const queue = repository([{ id: 'notification-customer', notification: customerNotification }, { id: 'notification-atelier', notification: atelierNotification }]);
    const delivered: string[] = [];

    await deliverLeadNotifications({ limit: 2 }, {
      repository: queue,
      sender: async (notification) => {
        if (notification.recipientKind === 'customer') throw new Error('SMTP indisponível');
        delivered.push(notification.recipientKind);
      },
    });

    expect(queue.retried).toEqual(['notification-customer']);
    expect(queue.sent).toEqual(['notification-atelier']);
    expect(delivered).toEqual(['atelier']);
  });

  it('nunca envia um destinatário desconhecido e o reagenda separadamente', async () => {
    const queue = repository([{ id: 'notification-unknown', notification: { recipientKind: 'unknown', payload: {} } }]);
    const sender = vi.fn();

    await deliverLeadNotifications({ limit: 1 }, { repository: queue, sender });

    expect(sender).not.toHaveBeenCalled();
    expect(queue.sent).toEqual([]);
    expect(queue.retried).toEqual(['notification-unknown']);
  });

  it('não reserva mensagens quando a configuração de e-mail está ausente', async () => {
    vi.stubEnv('GMAIL_SMTP_USER', '');
    vi.stubEnv('GMAIL_SMTP_APP_PASSWORD', '');
    vi.stubEnv('GMAIL_SMTP_FROM', '');
    vi.stubEnv('LEAD_NOTIFICATION_TO', '');
    const queue = repository([{ id: 'notification-1', notification: atelierNotification }]);

    await expect(deliverLeadNotifications({}, { repository: queue })).rejects.toThrow('Configuração de e-mail ausente.');

    expect(queue.claimed).toBe(0);
  });
});
