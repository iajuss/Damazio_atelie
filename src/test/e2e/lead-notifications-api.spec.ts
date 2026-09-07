import { expect, test } from '@playwright/test';
import { createLeadNotificationsGetHandler } from '@/app/api/internal/lead-notifications/route';

test('protege a recuperação de e-mails por token e não retorna dados do lead', async () => {
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
