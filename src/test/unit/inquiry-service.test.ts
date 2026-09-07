// @vitest-environment node

import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
import { createInquiry } from '@/features/inquiries/service';
import type { CatalogProduct } from '@/features/catalog/types';

const product: CatalogProduct = {
  id: 'product-1', lineSlug: 'enxovais', slug: 'toalha-bordada', name: 'Toalha bordada', description: null,
  materials: [], availability: 'available', media: [], customizationFields: [],
};

function input(overrides: Record<string, unknown> = {}) {
  return { productSlug: product.slug, name: 'Ana', contact: 'ana@example.com', city: 'São Paulo', state: 'SP', privacyAccepted: true, answers: {}, attachments: [], ...overrides };
}

function pngFile(name = 'referencia.png', size = 8) {
  return new File([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]).slice(0, size)], name, { type: 'image/png' });
}

describe('persistência de solicitação', () => {
  it('persiste solicitação e respostas em uma única operação e guarda anexo sem URL pública', async () => {
    const calls: unknown[] = [];
    const uploads: unknown[] = [];
    const result = await createInquiry(input({ attachments: [pngFile()] }), product, {
      createRequestCode: () => 'AB12CD34EF56GH78IJ90',
      client: {
        rpc: async (name, payload) => { calls.push([name, payload]); return { data: { inquiry_id: 'inquiry-1' }, error: null }; },
        storage: { from: () => ({ upload: async (path, file, options) => { uploads.push([path, file.name, options]); return { error: null }; }, remove: async () => ({ error: null }) }) },
      },
    });

    expect(result).toEqual({ requestCode: 'AB12CD34EF56GH78IJ90', message: 'Solicitação registrada com sucesso.' });
    expect(calls).toEqual([[ 'create_inquiry_with_answers', expect.objectContaining({
      p_request_code: 'AB12CD34EF56GH78IJ90',
      p_product_id: 'product-1',
      p_attachments: [expect.objectContaining({ mime_type: 'image/png', byte_size: 8 })],
      p_notification_payload: {
        requestCode: 'AB12CD34EF56GH78IJ90',
        requestKind: 'product',
        productName: 'Toalha bordada',
        name: 'Ana',
        contact: 'ana@example.com',
        city: 'São Paulo',
        state: 'SP',
        occasion: null,
        description: null,
        answers: {},
        attachments: [{ filename: 'referencia.png', mimeType: 'image/png', byteSize: 8 }],
      },
    }) ]]);
    expect(uploads).toEqual([[expect.stringMatching(/^AB12CD34EF56GH78IJ90\/[0-9a-f-]{36}\.png$/), 'referencia.png', { contentType: 'image/png', upsert: false }]]);
  });

  it('persiste uma criação livre sem produto, mantendo o protocolo privado', async () => {
    const calls: unknown[] = [];
    await createInquiry(input({ requestKind: 'custom', productSlug: '', description: 'Uma bolsa feita para minha mãe.' }), null, {
      createRequestCode: () => 'AB12CD34EF56GH78IJ90',
      client: { rpc: async (name, payload) => { calls.push([name, payload]); return { data: { inquiry_id: 'inquiry-1' }, error: null }; }, storage: { from: () => ({ upload: async () => ({ error: null }), remove: async () => ({ error: null }) }) } },
    });
    expect(calls).toEqual([[ 'create_inquiry_with_answers', expect.objectContaining({ p_request_kind: 'custom', p_product_id: null, p_answers: {} }) ]]);
  });

  it.each([
    ['formato inválido', new File(['texto'], 'referencia.gif', { type: 'image/gif' })],
    ['arquivo vazio', new File([], 'referencia.png', { type: 'image/png' })],
  ])('rejeita %s antes de gravar', async (_name, attachment) => {
    const rpc = async () => ({ data: null, error: null });
    await expect(createInquiry(input({ attachments: [attachment] }), product, { client: { rpc, storage: { from: () => ({ upload: async () => ({ error: null }), remove: async () => ({ error: null }) }) } } })).rejects.toMatchObject({ kind: 'validation' });
  });

  it('rejeita arquivo maior do que o limite antes de gravar', async () => {
    const attachment = new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'referencia.png', { type: 'image/png' });
    await expect(createInquiry(input({ attachments: [attachment] }), product, { client: { rpc: async () => ({ data: null, error: null }), storage: { from: () => ({ upload: async () => ({ error: null }), remove: async () => ({ error: null }) }) } } })).rejects.toMatchObject({ kind: 'payload_too_large' });
  });

  it('rejeita mais referências que o limite antes de gravar', async () => {
    await expect(createInquiry(input({ attachments: [pngFile('1.png'), pngFile('2.png'), pngFile('3.png'), pngFile('4.png')] }), product, { client: { rpc: async () => ({ data: null, error: null }), storage: { from: () => ({ upload: async () => ({ error: null }), remove: async () => ({ error: null }) }) } } })).rejects.toMatchObject({ kind: 'payload_too_large' });
  });
});
