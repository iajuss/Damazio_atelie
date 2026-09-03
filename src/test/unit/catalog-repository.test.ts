// @vitest-environment node

import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
import { createCatalogRepository } from '@/features/catalog/repository';

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  materials: string[] | null;
  availability: 'available' | 'limited' | 'unavailable';
  published: boolean;
  sort_order: number;
  product_line: { slug: string; published: boolean } | null;
  product_media: Array<{
    url: string;
    alt_text: string;
    caption: string | null;
    sort_order: number;
    is_featured: boolean;
  }>;
  customization_fields: Array<{
    key: string;
    label: string;
    field_type: 'text' | 'textarea' | 'select';
    required: boolean;
    options: string[] | null;
    help_text: string | null;
    sort_order: number;
  }>;
};

function productRow(overrides: Partial<ProductRow> = {}): ProductRow {
  return {
    id: 'product-1',
    slug: 'toalha-bordada',
    name: 'Toalha bordada',
    description: 'Peça personalizada para presentear.',
    materials: ['algodão'],
    availability: 'available',
    published: true,
    sort_order: 1,
    product_line: { slug: 'enxovais' , published: true },
    product_media: [
      { url: 'https://cdn.example/segunda.jpg', alt_text: 'Segundo ângulo', caption: null, sort_order: 2, is_featured: false },
      { url: 'https://cdn.example/capa.jpg', alt_text: 'Toalha bordada', caption: 'Detalhe do bordado', sort_order: 1, is_featured: true },
    ],
    customization_fields: [
      { key: 'nome', label: 'Nome a bordar', field_type: 'text', required: true, options: null, help_text: 'Como deseja escrever?', sort_order: 2 },
      { key: 'cor', label: 'Cor da linha', field_type: 'select', required: false, options: ['areia', 'rosé'], help_text: null, sort_order: 1 },
    ],
    ...overrides,
  };
}

function repositoryWithProducts(rows: ProductRow[]) {
  const query = {
    select: () => query,
    eq: () => query,
    neq: () => query,
    order: () => Promise.resolve({ data: rows, error: null }),
  };

  return createCatalogRepository({ from: () => query } as never);
}

describe('catálogo público', () => {
  it('mapeia uma linha válida de produto para o DTO público ordenado', async () => {
    const repository = repositoryWithProducts([productRow()]);

    await expect(repository.listPublishedProducts()).resolves.toEqual([
      {
        id: 'product-1',
        lineSlug: 'enxovais',
        slug: 'toalha-bordada',
        name: 'Toalha bordada',
        description: 'Peça personalizada para presentear.',
        materials: ['algodão'],
        availability: 'available',
        media: [
          { url: 'https://cdn.example/capa.jpg', altText: 'Toalha bordada', caption: 'Detalhe do bordado', sortOrder: 1, isFeatured: true },
          { url: 'https://cdn.example/segunda.jpg', altText: 'Segundo ângulo', caption: null, sortOrder: 2, isFeatured: false },
        ],
        customizationFields: [
          { key: 'cor', label: 'Cor da linha', type: 'select', required: false, options: ['areia', 'rosé'], helpText: null, sortOrder: 1 },
          { key: 'nome', label: 'Nome a bordar', type: 'text', required: true, options: [], helpText: 'Como deseja escrever?', sortOrder: 2 },
        ],
      },
    ]);
  });

  it('exclui produtos não publicados e indisponíveis mesmo se retornados pela fonte de dados', async () => {
    const repository = repositoryWithProducts([
      productRow(),
      productRow({ id: 'product-2', slug: 'rascunho', published: false }),
      productRow({ id: 'product-3', slug: 'pausado', availability: 'unavailable' }),
      productRow({ id: 'product-4', slug: 'linha-oculta', product_line: { slug: 'oculta', published: false } }),
    ]);

    await expect(repository.listPublishedProducts()).resolves.toMatchObject([
      { id: 'product-1', slug: 'toalha-bordada' },
    ]);
    await expect(repository.listPublishedProducts()).resolves.toHaveLength(1);
  });
});
