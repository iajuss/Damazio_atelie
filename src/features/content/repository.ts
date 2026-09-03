import { listPublishedLines, listPublishedProducts } from '@/features/catalog/repository';
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

export async function getHomeContent(): Promise<HomeContent> {
  const [lines, products] = await Promise.all([
    publishedOrFallback(listPublishedLines, fallbackLines),
    publishedOrFallback(listPublishedProducts, fallbackProducts),
  ]);
  return { hero: { eyebrow: 'Damazio Atelier', title: 'Peças que contam histórias', description: 'Bordados, crochê e presentes autorais feitos sob encomenda para transformar afeto em memória.' }, lines: lines.slice(0, 4), products: products.slice(0, 3) };
}
