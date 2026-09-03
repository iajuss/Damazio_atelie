import { expect, test } from '@playwright/test';
import { createInquiryPostHandler, GET } from '@/app/api/inquiries/route';
import type { CatalogProduct } from '@/features/catalog/types';

const product: CatalogProduct = { id: 'product-1', lineSlug: 'enxovais', slug: 'toalha-bordada', name: 'Toalha bordada', description: null, materials: [], availability: 'available', media: [], customizationFields: [] };

function form(overrides: Record<string, string | File> = {}) {
  const data = new FormData();
  Object.entries({ productSlug: 'toalha-bordada', name: 'Ana', contact: 'ana@example.com', city: 'São Paulo', state: 'SP', privacyAccepted: 'true', ...overrides }).forEach(([key, value]) => data.set(key, value));
  return data;
}

function request(data: FormData) {
  return new Request('https://damazio.example/api/inquiries', { method: 'POST', headers: { origin: 'https://damazio.example', 'x-forwarded-for': '203.0.113.10' }, body: data });
}

test('aceita multipart válido e retorna somente o protocolo público', async () => {
  const post = createInquiryPostHandler({ expectedOrigin: 'https://damazio.example', loadProduct: async () => product, rateLimit: () => true, createInquiry: async () => ({ requestCode: 'AB12CD34EF56GH78IJ90', message: 'Solicitação registrada com sucesso.' }) });
  const response = await post(request(form()));
  await expect(response.json()).resolves.toEqual({ requestCode: 'AB12CD34EF56GH78IJ90', message: 'Solicitação registrada com sucesso.' });
  expect(response.status).toBe(201);
});

test('retorna erros de campos, bloqueia excesso e não disponibiliza leitura anônima de referências', async () => {
  const post = createInquiryPostHandler({ expectedOrigin: 'https://damazio.example', loadProduct: async () => product, rateLimit: () => true, createInquiry: async () => { throw { kind: 'payload_too_large' }; } });
  const bad = await post(request(form({ name: '' })));
  expect(bad.status).toBe(400);
  await expect(bad.json()).resolves.toMatchObject({ error: { code: 'VALIDACAO', fields: { name: expect.any(String) } } });
  const large = await post(request(form()));
  expect(large.status).toBe(413);
  expect(large.headers.get('cache-control')).toBe('no-store');
});

test('recusa estouro de taxa e origem não confiável', async () => {
  const limited = createInquiryPostHandler({ expectedOrigin: 'https://damazio.example', loadProduct: async () => product, rateLimit: () => false, createInquiry: async () => ({ requestCode: 'AB12CD34EF56GH78IJ90', message: 'Solicitação registrada com sucesso.' }) });
  expect((await limited(request(form()))).status).toBe(429);
  const secured = createInquiryPostHandler({ expectedOrigin: 'https://damazio.example', loadProduct: async () => product, rateLimit: () => true, createInquiry: async () => ({ requestCode: 'AB12CD34EF56GH78IJ90', message: 'Solicitação registrada com sucesso.' }) });
  const hostile = new Request('https://damazio.example/api/inquiries', { method: 'POST', headers: { origin: 'https://outro.example' }, body: form() });
  expect((await secured(hostile)).status).toBe(400);
});

test('não oferece leitura anônima de referências privadas', async () => {
  const response = await GET();
  expect(response.status).toBe(404);
  await expect(response.json()).resolves.toEqual({ error: { code: 'NAO_ENCONTRADO', message: 'Referências de clientes são privadas.' } });
});
