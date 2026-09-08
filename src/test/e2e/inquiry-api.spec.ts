import { expect, test } from '@playwright/test';
import { createInquiryPostHandler, GET } from '@/app/api/inquiries/route';
import type { CatalogProduct } from '@/features/catalog/types';

const product: CatalogProduct = { id: 'product-1', lineSlug: 'enxovais', slug: 'toalha-bordada', name: 'Toalha bordada', description: null, materials: [], availability: 'available', media: [], customizationFields: [] };

function form(overrides: Record<string, string | File> = {}) {
  const data = new FormData();
  Object.entries({
    productSlug: 'toalha-bordada',
    name: 'Ana',
    contact: 'ana@example.com',
    email: 'ana@example.com',
    phone: '11999999999',
    postalCode: '01001000',
    street: 'Praça da Sé',
    addressNumber: '1',
    complement: '',
    neighborhood: 'Sé',
    city: 'São Paulo',
    state: 'SP',
    privacyAccepted: 'true',
    ...overrides,
  }).forEach(([key, value]) => data.set(key, value));
  return data;
}

function request(data: FormData) {
  return new Request('https://damazio.example/api/inquiries', { method: 'POST', headers: { origin: 'https://damazio.example', 'x-forwarded-for': '203.0.113.10' }, body: data });
}

test('aceita multipart válido e retorna somente o protocolo público', async () => {
  const deliveries: unknown[] = [];
  const post = createInquiryPostHandler({
    expectedOrigin: 'https://damazio.example', loadProduct: async () => product, rateLimit: () => true,
    createInquiry: async () => ({ requestCode: 'AB12CD34EF56GH78IJ90', message: 'Solicitação registrada com sucesso.' }),
    deliverNotifications: async (options) => { deliveries.push(options); },
  });
  const response = await post(request(form()));
  await expect(response.json()).resolves.toEqual({ requestCode: 'AB12CD34EF56GH78IJ90', message: 'Solicitação registrada com sucesso.' });
  expect(response.status).toBe(201);
  expect(response.headers.get('x-robots-tag')).toBe('noindex, nofollow, noarchive');
  expect(deliveries).toEqual([{ requestCode: 'AB12CD34EF56GH78IJ90', limit: 1 }]);
});

test('confirma a solicitação mesmo quando a notificação imediata falha', async () => {
  const post = createInquiryPostHandler({
    expectedOrigin: 'https://damazio.example', loadProduct: async () => product, rateLimit: () => true,
    createInquiry: async () => ({ requestCode: 'AB12CD34EF56GH78IJ90', message: 'Solicitação registrada com sucesso.' }),
    deliverNotifications: async () => { throw new Error('SMTP indisponível'); },
  });

  const response = await post(request(form()));

  expect(response.status).toBe(201);
  await expect(response.json()).resolves.toEqual({ requestCode: 'AB12CD34EF56GH78IJ90', message: 'Solicitação registrada com sucesso.' });
});

test('aceita criação livre e gera protocolo sem carregar uma inspiração', async () => {
  let productWasLoaded = false;
  const post = createInquiryPostHandler({ expectedOrigin: 'https://damazio.example', rateLimit: () => true, loadProduct: async () => { productWasLoaded = true; return product; }, createInquiry: async () => ({ requestCode: 'AB12CD34EF56GH78IJ90', message: 'Solicitação registrada com sucesso.' }), deliverNotifications: async () => {} });
  const response = await post(request(form({ requestKind: 'custom', productSlug: '', description: 'Quero uma peça para presentear minha mãe.', answers: '{}' })));
  expect(response.status).toBe(201);
  expect(productWasLoaded).toBe(false);
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

test('não deriva a origem permitida da URL recebida quando não há configuração', async () => {
  const post = createInquiryPostHandler({ allowedOrigins: [], rateLimit: () => true, loadProduct: async () => product, createInquiry: async () => ({ requestCode: 'AB12CD34EF56GH78IJ90', message: 'Solicitação registrada com sucesso.' }) });
  const response = await post(request(form()));
  expect(response.status).toBe(400);
});

test('limita answers antes de analisar JSON e não reflete chave arbitrária no erro', async () => {
  let productWasLoaded = false;
  const post = createInquiryPostHandler({ expectedOrigin: 'https://damazio.example', rateLimit: () => true, loadProduct: async () => { productWasLoaded = true; return product; }, createInquiry: async () => ({ requestCode: 'AB12CD34EF56GH78IJ90', message: 'Solicitação registrada com sucesso.' }) });
  const oversized = await post(request(form({ answers: JSON.stringify({ referencia: 'x'.repeat(17_000) }) })));
  expect(oversized.status).toBe(400);
  expect(productWasLoaded).toBe(false);

  const arbitraryKey = 'nao_reflita_esta_chave_de_atacante_comprida_demais_123456789';
  const reflected = await post(request(form({ answers: JSON.stringify({ [arbitraryKey]: 'x' }) })));
  expect(await reflected.text()).not.toContain(arbitraryKey);
});

test('normaliza o slug antes de consultar o produto', async () => {
  let requestedSlug = '';
  const post = createInquiryPostHandler({ expectedOrigin: 'https://damazio.example', rateLimit: () => true, loadProduct: async (slug) => { requestedSlug = slug; return product; }, createInquiry: async () => ({ requestCode: 'AB12CD34EF56GH78IJ90', message: 'Solicitação registrada com sucesso.' }), deliverNotifications: async () => {} });
  const response = await post(request(form({ productSlug: '  TOALHA-BORDADA  ' })));
  expect(response.status).toBe(201);
  expect(requestedSlug).toBe('toalha-bordada');
});

test('não oferece leitura anônima de referências privadas', async () => {
  const response = await GET();
  expect(response.status).toBe(404);
  expect(response.headers.get('x-robots-tag')).toBe('noindex, nofollow, noarchive');
  await expect(response.json()).resolves.toEqual({ error: { code: 'NAO_ENCONTRADO', message: 'Referências de clientes são privadas.' } });
});
