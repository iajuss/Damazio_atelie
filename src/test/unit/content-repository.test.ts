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

  it('recorre ao catálogo editorial determinístico se a consulta publicada falhar', async () => {
    listPublishedLines.mockRejectedValue(new Error('Falha remota'));
    listPublishedProducts.mockRejectedValue(new Error('Falha remota'));

    const content = await getCatalogContent();

    expect(content.lines.map((line) => line.slug)).toEqual([
      'bordados-em-roupas',
      'enxovais-e-toalhas',
      'bolsas-de-croche',
      'presentes-e-embalagens',
      'sousplats-de-croche',
    ]);
    expect(content.products.map((product) => product.slug)).toEqual([
      'camisa-bordada',
      'toalha-personalizada',
      'bolsa-de-croche',
      'presente-embalado',
      'sousplat-de-croche',
    ]);
  });

  it('não expõe um slug ausente na consulta direta de catálogo configurado', async () => {
    await expect(getCatalogProductBySlug('camisa-bordada')).resolves.toBeNull();
  });

  it('recorre ao produto editorial determinístico se a consulta direta falhar', async () => {
    getPublishedProductBySlug.mockRejectedValue(new Error('Falha remota'));

    await expect(getCatalogProductBySlug('camisa-bordada')).resolves.toMatchObject({ slug: 'camisa-bordada' });
  });

  it('usa referências editoriais apenas sem a configuração pública local', async () => {
    getPublicSupabaseEnv.mockImplementation(() => {
      throw new Error('Variáveis públicas ausentes');
    });

    const content = await getCatalogContent();

    expect(content.lines).toHaveLength(5);
    expect(content.products.map((product) => product.slug)).toContain('camisa-bordada');
  });

  it('oferece uma foto local para cada uma das cinco linhas no catálogo editorial', async () => {
    getPublicSupabaseEnv.mockImplementation(() => {
      throw new Error('Variáveis públicas ausentes');
    });

    const content = await getHomeContent();

    expect(content.lines.map((line) => line.coverImage)).toEqual([
      '/images/catalogo/camisa-bordada-sem-marca.jpeg',
      '/images/catalogo/toalhas-personalizadas-sem-marca.jpeg',
      '/images/catalogo/bolsa-croche-sem-marca.jpeg',
      '/images/catalogo/presente-embalado.jpeg',
      '/images/catalogo/sousplat-rosa-croche.jpeg',
    ]);
  });

  it('oferece uma foto local para cada inspiração de produto editorial', async () => {
    getPublicSupabaseEnv.mockImplementation(() => {
      throw new Error('Variáveis públicas ausentes');
    });

    const content = await getHomeContent();

    expect(content.products.map((product) => product.media[0]?.url)).toEqual([
      '/images/catalogo/camisa-bordada-sem-marca.jpeg',
      '/images/catalogo/toalhas-personalizadas-sem-marca.jpeg',
      '/images/catalogo/bolsa-croche-sem-marca.jpeg',
    ]);
  });
});
