import { describe, expect, it, vi } from 'vitest';
import type { CatalogLine, CatalogProduct } from '@/features/catalog/types';

const getCatalogContent = vi.fn();

vi.mock('@/features/content/repository', () => ({ getCatalogContent }));

const { default: sitemap } = await import('@/app/sitemap');

const publishedLine: CatalogLine = {
  id: 'linha-publicada',
  slug: 'linha-publicada',
  name: 'Linha publicada',
  description: null,
  coverImage: null,
  sortOrder: 1,
};

const publishedProduct: CatalogProduct = {
  id: 'produto-publicado',
  lineSlug: 'linha-publicada',
  slug: 'produto-publicado',
  name: 'Produto publicado',
  description: null,
  materials: [],
  availability: 'available',
  media: [],
  customizationFields: [],
};

describe('sitemap', () => {
  it('relaciona linhas, produtos e solicitações publicados pelo repositório', async () => {
    getCatalogContent.mockResolvedValue({ lines: [publishedLine], products: [publishedProduct] });

    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(urls).toContain('http://localhost:3000/catalogo/linha-publicada');
    expect(urls).toContain('http://localhost:3000/produtos/produto-publicado');
    expect(urls).toContain('http://localhost:3000/solicitar-orcamento/produto-publicado');
    expect(urls).not.toContain('http://localhost:3000/produtos/camisa-bordada');
  });
});

