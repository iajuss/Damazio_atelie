import { describe, expect, it } from 'vitest';
import { createInquiryPostHandler } from '@/app/api/inquiries/route';
import type { CatalogProduct } from '@/features/catalog/types';

const product: CatalogProduct = { id: 'product-1', lineSlug: 'enxovais', slug: 'toalha-bordada', name: 'Toalha bordada', description: null, materials: [], availability: 'available', media: [], customizationFields: [] };

function request() {
  const data = new FormData();
  for (const [key, value] of Object.entries({ productSlug: 'toalha-bordada', name: 'Ana', contact: 'ana@example.com', city: 'São Paulo', state: 'SP', privacyAccepted: 'true' })) data.set(key, value);
  return new Request('https://damazio.example/api/inquiries', { method: 'POST', headers: { origin: 'https://damazio.example' }, body: data });
}

describe('notificação imediata da solicitação', () => {
  it('mantém a confirmação pública após reservar a notificação do protocolo', async () => {
    const deliveries: unknown[] = [];
    const post = createInquiryPostHandler({
      expectedOrigin: 'https://damazio.example', loadProduct: async () => product, rateLimit: () => true,
      createInquiry: async () => ({ requestCode: 'AB12CD34EF56GH78IJ90', message: 'Solicitação registrada com sucesso.' }),
      deliverNotifications: async (options) => { deliveries.push(options); },
    });

    const response = await post(request());

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ requestCode: 'AB12CD34EF56GH78IJ90', message: 'Solicitação registrada com sucesso.' });
    expect(deliveries).toEqual([{ requestCode: 'AB12CD34EF56GH78IJ90', limit: 1 }]);
  });

  it('preserva a confirmação quando o e-mail falha', async () => {
    const post = createInquiryPostHandler({
      expectedOrigin: 'https://damazio.example', loadProduct: async () => product, rateLimit: () => true,
      createInquiry: async () => ({ requestCode: 'AB12CD34EF56GH78IJ90', message: 'Solicitação registrada com sucesso.' }),
      deliverNotifications: async () => { throw new Error('SMTP indisponível'); },
    });

    const response = await post(request());

    expect(response.status).toBe(201);
  });
});
