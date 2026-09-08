import 'server-only';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getLeadEmailConfig, sendLeadEmail, type QueuedLeadNotification } from './lead-email';

type UnknownQueuedNotification = { recipientKind: 'unknown'; payload: unknown };
type NotificationRow = { id: string; notification: QueuedLeadNotification | UnknownQueuedNotification };

export type NotificationRepository = {
  claim: (limit: number, requestCode?: string) => Promise<NotificationRow[]>;
  markSent: (id: string) => Promise<void>;
  reschedule: (id: string, reason: string) => Promise<void>;
};

type NotificationClient = {
  rpc: (name: string, payload: Record<string, unknown>) => Promise<{ data: unknown; error: unknown | null }>;
};

function notificationRepository(): NotificationRepository {
  const client = createServerSupabaseClient() as unknown as NotificationClient;

  return {
    async claim(limit, requestCode) {
      const response = await client.rpc('claim_inquiry_email_notifications', {
        p_limit: limit,
        p_request_code: requestCode ?? null,
      });
      if (response.error) throw new Error('Não foi possível reservar notificações de lead.');
      const rows = Array.isArray(response.data) ? response.data : [];
      return rows.map((row) => {
        const item = row as { notification_id: unknown; recipient_kind: unknown; payload: unknown };
        if (typeof item.notification_id !== 'string') return null;
        if (item.recipient_kind === 'atelier' || item.recipient_kind === 'customer') {
          return { id: item.notification_id, notification: { recipientKind: item.recipient_kind, payload: item.payload } as QueuedLeadNotification };
        }
        return { id: item.notification_id, notification: { recipientKind: 'unknown', payload: item.payload } };
      }).filter((row): row is NotificationRow => row !== null);
    },
    async markSent(id) {
      const response = await client.rpc('mark_inquiry_email_notification_sent', { p_notification_id: id });
      if (response.error) throw new Error('Não foi possível confirmar a notificação de lead.');
    },
    async reschedule(id, reason) {
      const response = await client.rpc('reschedule_inquiry_email_notification', {
        p_notification_id: id,
        p_error: reason,
      });
      if (response.error) throw new Error('Não foi possível reagendar a notificação de lead.');
    },
  };
}

export async function deliverLeadNotifications(
  options: { requestCode?: string; limit?: number } = {},
  dependencies: { repository?: NotificationRepository; sender?: (notification: QueuedLeadNotification) => Promise<void> } = {},
): Promise<void> {
  const sender = dependencies.sender ?? (() => {
    const config = getLeadEmailConfig();
    return (notification: QueuedLeadNotification) => sendLeadEmail(notification, config);
  })();
  const repository = dependencies.repository ?? notificationRepository();
  const rows = await repository.claim(options.limit ?? 10, options.requestCode);

  for (const row of rows) {
    if (row.notification.recipientKind === 'unknown') {
      try {
        await repository.reschedule(row.id, 'Tipo de destinatário inválido.');
      } catch {
        // A recuperação pelo cron tratará a mensagem ainda reservada após o prazo de bloqueio.
      }
      continue;
    }
    try {
      await sender(row.notification);
      await repository.markSent(row.id);
    } catch {
      try {
        await repository.reschedule(row.id, 'Falha temporária ao enviar notificação por e-mail.');
      } catch {
        // A recuperação pelo cron tratará a mensagem ainda reservada após o prazo de bloqueio.
      }
    }
  }
}
