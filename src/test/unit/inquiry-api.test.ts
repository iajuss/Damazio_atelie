import { describe, expect, it, vi } from 'vitest';
import { createInquiryPostHandler } from '@/app/api/inquiries/route';
import type { CatalogProduct } from '@/features/catalog/types';

const product: CatalogProduct = { id: 'product-1', lineSlug: 'enxovais', slug: 'toalha-bordada', name: 'Toalha bordada', description: null, materials: [], availability: 'available', media: [], customizationFields: [] };

function request(overrides: Record<string, string> = {}) {
  const data = new FormData();
  for (const [key, value] of Object.entries({
    productSlug: 'toalha-bordada', name: 'Ana', contact: 'forjado@example.com', email: 'ana@example.com', phone: '11999999999',
    postalCode: '01001000', street: 'Praça da Sé', addressNumber: '1', complement: '', neighborhood: 'Sé', city: 'São Paulo', state: 'SP', description: 'Uma peça especial', privacyAccepted: 'true',
    ...overrides,
  })) data.set(key, value);
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
    expect(deliveries).toEqual([{ requestCode: 'AB12CD34EF56GH78IJ90', limit: 2 }]);
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

  it('usa o e-mail como contato interno e ignora o contato enviado pelo formulário', async () => {
    let received: unknown;
    const post = createInquiryPostHandler({
      expectedOrigin: 'https://damazio.example', loadProduct: async () => product, rateLimit: () => true,
      createInquiry: async (input) => {
        received = input;
        return { requestCode: 'AB12CD34EF56GH78IJ90', message: 'Solicitação registrada com sucesso.' };
      },
      deliverNotifications: async () => undefined,
    });

    const response = await post(request({ contact: 'nao-usar@example.com', email: 'cliente@example.com' }));

    expect(response.status).toBe(201);
    expect(received).toMatchObject({
      email: 'cliente@example.com', phone: '11999999999', postalCode: '01001000', street: 'Praça da Sé',
      addressNumber: '1', neighborhood: 'Sé', city: 'São Paulo', state: 'SP', contact: 'cliente@example.com',
    });
  });

  it('registra a etapa técnica quando falha antes de persistir o lead', async () => {
    const report = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const post = createInquiryPostHandler({
      expectedOrigin: 'https://damazio.example',
      loadProduct: async () => { throw new Error('Variável de ambiente obrigatória ausente: SUPABASE_SERVICE_ROLE_KEY'); },
      rateLimit: () => true,
    });

    try {
      const response = await post(request());

      expect(response.status).toBe(500);
      expect(report).toHaveBeenCalledWith('inquiry_submission_failed', {
        stage: 'load_product',
        name: 'Error',
        message: 'Variável de ambiente obrigatória ausente: SUPABASE_SERVICE_ROLE_KEY',
      });
    } finally {
      report.mockRestore();
    }
  });
});
