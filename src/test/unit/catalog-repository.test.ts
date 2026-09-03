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

type ProductLineRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  cover_image: string | null;
  sort_order: number;
  published: boolean;
};

function productLineRow(overrides: Partial<ProductLineRow> = {}): ProductLineRow {
  return {
    id: 'line-1',
    slug: 'enxovais',
    name: 'Enxovais personalizados',
    description: 'Peças bordadas para a casa.',
    cover_image: 'https://cdn.example/enxovais.jpg',
    sort_order: 1,
    published: true,
    ...overrides,
  };
}

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

function repositoryWithCatalog({
  productRows = [],
  productLineRows = [],
}: {
  productRows?: ProductRow[];
  productLineRows?: ProductLineRow[];
}) {
  function queryFor(table: 'products' | 'product_lines') {
    let requestedSlug: string | undefined;
    const rows = table === 'products' ? productRows : productLineRows;
    const query = {
      select: () => query,
      eq: (column: string, value: unknown) => {
        if (column === 'slug') {
          requestedSlug = String(value);
        }
        return query;
      },
      neq: () => query,
      order: () => Promise.resolve({ data: rows, error: null }),
      limit: () => query,
      maybeSingle: () => Promise.resolve({
        data: rows.find((row) => row.slug === requestedSlug) ?? null,
        error: null,
      }),
    };

    return query;
  }

  return createCatalogRepository({ from: queryFor } as never);
}

describe('catálogo público', () => {
  it('mapeia uma linha válida de produto para o DTO público ordenado', async () => {
    const repository = repositoryWithCatalog({ productRows: [productRow()] });

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
    const repository = repositoryWithCatalog({
      productRows: [
        productRow(),
        productRow({ id: 'product-2', slug: 'rascunho', published: false }),
        productRow({ id: 'product-3', slug: 'pausado', availability: 'unavailable' }),
        productRow({ id: 'product-4', slug: 'linha-oculta', product_line: { slug: 'oculta', published: false } }),
      ],
    });

    await expect(repository.listPublishedProducts()).resolves.toMatchObject([
      { id: 'product-1', slug: 'toalha-bordada' },
    ]);
    await expect(repository.listPublishedProducts()).resolves.toHaveLength(1);
  });

  it('lista somente linhas publicadas', async () => {
    const repository = repositoryWithCatalog({
      productLineRows: [
        productLineRow(),
        productLineRow({ id: 'line-2', slug: 'rascunho', published: false }),
      ],
    });

    await expect(repository.listPublishedLines()).resolves.toEqual([
      {
        id: 'line-1',
        slug: 'enxovais',
        name: 'Enxovais personalizados',
        description: 'Peças bordadas para a casa.',
        coverImage: 'https://cdn.example/enxovais.jpg',
        sortOrder: 1,
      },
    ]);
  });

  it('retorna a linha publicada correspondente ao slug', async () => {
    const repository = repositoryWithCatalog({ productLineRows: [productLineRow()] });

    await expect(repository.getPublishedLineBySlug('enxovais')).resolves.toEqual({
      id: 'line-1',
      slug: 'enxovais',
      name: 'Enxovais personalizados',
      description: 'Peças bordadas para a casa.',
      coverImage: 'https://cdn.example/enxovais.jpg',
      sortOrder: 1,
    });
  });

  it('retorna null quando o slug de linha não existe', async () => {
    const repository = repositoryWithCatalog({ productLineRows: [productLineRow()] });

    await expect(repository.getPublishedLineBySlug('inexistente')).resolves.toBeNull();
  });

  it('retorna o produto publicado correspondente ao slug', async () => {
    const repository = repositoryWithCatalog({ productRows: [productRow()] });

    await expect(repository.getPublishedProductBySlug('toalha-bordada')).resolves.toMatchObject({
      id: 'product-1',
      lineSlug: 'enxovais',
      slug: 'toalha-bordada',
      availability: 'available',
    });
  });

  it('retorna o produto publicado indisponível pela consulta direta de slug', async () => {
    const repository = repositoryWithCatalog({
      productRows: [productRow({ slug: 'pausado', availability: 'unavailable' })],
    });

    await expect(repository.getPublishedProductBySlug('pausado')).resolves.toMatchObject({
      slug: 'pausado',
      availability: 'unavailable',
    });
  });

  it('retorna null quando o slug de produto não existe', async () => {
    const repository = repositoryWithCatalog({ productRows: [productRow()] });

    await expect(repository.getPublishedProductBySlug('inexistente')).resolves.toBeNull();
  });

  it('não retorna um produto não publicado pela consulta direta de slug', async () => {
    const repository = repositoryWithCatalog({
      productRows: [productRow({ slug: 'rascunho', published: false })],
    });

    await expect(repository.getPublishedProductBySlug('rascunho')).resolves.toBeNull();
  });
});
