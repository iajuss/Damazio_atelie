import { timingSafeEqual } from 'node:crypto';

import { deliverLeadNotifications } from '@/features/inquiries/lead-notifications';

export const runtime = 'nodejs';

type Delivery = (options: { limit?: number }) => Promise<void>;

type LeadNotificationsHandlerDependencies = {
  cronSecret?: string;
  deliverNotifications?: Delivery;
};

const privateResponseHeaders = {
  'cache-control': 'no-store',
  'x-robots-tag': 'noindex, nofollow, noarchive',
};

function isAuthorized(authorization: string | null, secret: string): boolean {
  if (!secret) return false;
  const received = Buffer.from(authorization ?? '', 'utf8');
  const expected = Buffer.from(`Bearer ${secret}`, 'utf8');
  return received.length === expected.length && timingSafeEqual(received, expected);
}

export function createLeadNotificationsGetHandler(dependencies: LeadNotificationsHandlerDependencies = {}) {
  return async function get(request: Request): Promise<Response> {
    const cronSecret = dependencies.cronSecret ?? process.env.CRON_SECRET?.trim() ?? '';
    if (!isAuthorized(request.headers.get('authorization'), cronSecret)) {
      return Response.json({ error: 'Não autorizado.' }, { status: 401, headers: privateResponseHeaders });
    }

    try {
      await (dependencies.deliverNotifications ?? deliverLeadNotifications)({ limit: 10 });
      return Response.json({ processed: true }, { headers: privateResponseHeaders });
    } catch {
      return Response.json({ error: 'Não foi possível processar as notificações.' }, { status: 500, headers: privateResponseHeaders });
    }
  };
}

export const GET = createLeadNotificationsGetHandler();
