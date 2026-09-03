import { getPublishedProductBySlug, listPublishedLines, listPublishedProducts } from '@/features/catalog/repository';
import type { CatalogLine, CatalogProduct } from '@/features/catalog/types';
import type { HomeContent } from './types';

const fallbackLines: CatalogLine[] = [
  { id: 'bordados', slug: 'bordados-em-roupas', name: 'Bordados em roupas', description: 'Detalhes que levam significado às peças do dia a dia.', coverImage: null, sortOrder: 1 },
  { id: 'enxovais', slug: 'enxovais-e-toalhas', name: 'Enxovais e toalhas', description: 'Afeto bordado para chegadas, celebrações e rituais de casa.', coverImage: null, sortOrder: 2 },
  { id: 'bolsas', slug: 'bolsas-de-croche', name: 'Bolsas de crochê', description: 'Texturas autorais feitas à mão para acompanhar novos caminhos.', coverImage: null, sortOrder: 3 },
  { id: 'presentes', slug: 'presentes-e-embalagens', name: 'Presentes e embalagens', description: 'Gestos delicados apresentados com o cuidado de uma lembrança.', coverImage: null, sortOrder: 4 },
];

const fallbackProducts: CatalogProduct[] = [
  { id: 'camisa', lineSlug: 'bordados-em-roupas', slug: 'camisa-bordada', name: 'Camisa bordada', description: 'Uma inspiração para celebrar memórias em pequenos detalhes.', materials: [], availability: 'available', media: [], customizationFields: [] },
  { id: 'toalha', lineSlug: 'enxovais-e-toalhas', slug: 'toalha-personalizada', name: 'Toalha personalizada', description: 'Um gesto de cuidado pensado para acompanhar a rotina.', materials: [], availability: 'available', media: [], customizationFields: [] },
  { id: 'bolsa', lineSlug: 'bolsas-de-croche', slug: 'bolsa-de-croche', name: 'Bolsa de crochê', description: 'Trama e acabamento para transformar o cotidiano.', materials: [], availability: 'limited', media: [], customizationFields: [] },
];

async function publishedOrFallback<T>(load: () => Promise<T[]>, fallback: T[]): Promise<T[]> {
  try {
    const content = await load();
    return content.length > 0 ? content : fallback;
  } catch {
    return fallback;
  }
}

function mergeEditorialLines(publishedLines: CatalogLine[]): CatalogLine[] {
  const publishedBySlug = new Map(publishedLines.map((line) => [line.slug, line]));

  return fallbackLines.map((fallbackLine) => publishedBySlug.get(fallbackLine.slug) ?? fallbackLine);
}

export async function getHomeContent(): Promise<HomeContent> {
  const catalog = await getCatalogContent();
  return { hero: { eyebrow: 'Damazio Atelier', title: 'Peças que contam histórias', description: 'Bordados, crochê e presentes autorais feitos sob encomenda para transformar afeto em memória.' }, lines: catalog.lines, products: catalog.products.slice(0, 3) };
}

export async function getCatalogContent(): Promise<Pick<HomeContent, 'lines' | 'products'>> {
  const [publishedLines, products] = await Promise.all([
    publishedOrFallback(listPublishedLines, fallbackLines),
    publishedOrFallback(listPublishedProducts, fallbackProducts),
  ]);
  return { lines: mergeEditorialLines(publishedLines), products };
}

export async function getCatalogProductBySlug(slug: string): Promise<CatalogProduct | null> {
  try {
    const publishedProduct = await getPublishedProductBySlug(slug);
    if (publishedProduct) return publishedProduct;
  } catch {
    // O catálogo editorial mantém referências locais quando o serviço público não está configurado.
  }

  const { products } = await getCatalogContent();
  return products.find((product) => product.slug === slug) ?? null;
}
