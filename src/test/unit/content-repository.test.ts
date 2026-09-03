import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CatalogLine, CatalogProduct } from '@/features/catalog/types';

const listPublishedLines = vi.fn();
const listPublishedProducts = vi.fn();
const getPublishedProductBySlug = vi.fn();
const getPublicSupabaseEnv = vi.fn();

vi.mock('@/features/catalog/repository', () => ({
  listPublishedLines,
  listPublishedProducts,
  getPublishedProductBySlug,
}));

vi.mock('@/lib/env', () => ({ getPublicSupabaseEnv }));

const { getCatalogContent, getCatalogProductBySlug, getHomeContent } = await import('@/features/content/repository');

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
    getPublicSupabaseEnv.mockReturnValue({
      url: 'https://catalogo.example.test',
      publishableKey: 'chave-publica',
    });
    listPublishedProducts.mockResolvedValue([] satisfies CatalogProduct[]);
    getPublishedProductBySlug.mockResolvedValue(null);
  });

  it('usa apenas linhas publicadas quando o catálogo configurado está parcial', async () => {
    listPublishedLines.mockResolvedValue([publishedBordados]);

    const content = await getHomeContent();

    expect(content.lines).toHaveLength(1);
    expect(content.lines[0]).toEqual(publishedBordados);
  });

  it('não repõe conteúdo editorial quando o catálogo configurado não tem publicação', async () => {
    listPublishedLines.mockResolvedValue([] satisfies CatalogLine[]);

    await expect(getCatalogContent()).resolves.toEqual({ lines: [], products: [] });
  });

  it('não expõe um slug ausente na consulta direta de catálogo configurado', async () => {
    await expect(getCatalogProductBySlug('camisa-bordada')).resolves.toBeNull();
  });

  it('usa referências editoriais apenas sem a configuração pública local', async () => {
    getPublicSupabaseEnv.mockImplementation(() => {
      throw new Error('Variáveis públicas ausentes');
    });

    const content = await getCatalogContent();

    expect(content.lines).toHaveLength(4);
    expect(content.products.map((product) => product.slug)).toContain('camisa-bordada');
  });
});
