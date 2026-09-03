import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CatalogLine, CatalogProduct } from '@/features/catalog/types';

const listPublishedLines = vi.fn();
const listPublishedProducts = vi.fn();

vi.mock('@/features/catalog/repository', () => ({
  listPublishedLines,
  listPublishedProducts,
}));

const { getHomeContent } = await import('@/features/content/repository');

const publishedBordados: CatalogLine = {
  id: 'publicado-bordados',
  slug: 'bordados-em-roupas',
  name: 'Bordados em roupas publicados',
  description: 'Dados publicados devem ter prioridade.',
  coverImage: 'https://cdn.example.test/bordados.jpg',
  sortOrder: 1,
};

describe('getHomeContent', () => {
  beforeEach(() => {
    listPublishedProducts.mockResolvedValue([] satisfies CatalogProduct[]);
  });

  it('mantém as quatro linhas editoriais quando o catálogo publicado está parcial', async () => {
    listPublishedLines.mockResolvedValue([publishedBordados]);

    const content = await getHomeContent();

    expect(content.lines).toHaveLength(4);
    expect(content.lines.map((line) => line.slug)).toEqual([
      'bordados-em-roupas',
      'enxovais-e-toalhas',
      'bolsas-de-croche',
      'presentes-e-embalagens',
    ]);
    expect(content.lines[0]).toEqual(publishedBordados);
  });
});
