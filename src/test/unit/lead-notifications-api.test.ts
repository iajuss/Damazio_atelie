import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
import { createLeadNotificationsGetHandler } from '@/app/api/internal/lead-notifications/route';

describe('recuperação de notificações por cron', () => {
  it('recusa token incorreto e processa a fila sem revelar dados do lead', async () => {
    const calls: unknown[] = [];
    const get = createLeadNotificationsGetHandler({
      cronSecret: 'test-cron-secret',
      deliverNotifications: async (options) => { calls.push(options); },
    });

    expect((await get(new Request('https://damazio.example/api/internal/lead-notifications'))).status).toBe(401);
    expect((await get(new Request('https://damazio.example/api/internal/lead-notifications', { headers: { authorization: 'Bearer wrong-secret' } }))).status).toBe(401);

    const response = await get(new Request('https://damazio.example/api/internal/lead-notifications', { headers: { authorization: 'Bearer test-cron-secret' } }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ processed: true });
    expect(calls).toEqual([{ limit: 10 }]);
    expect(response.headers.get('cache-control')).toBe('no-store');
  });
});
