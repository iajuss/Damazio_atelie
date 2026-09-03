import { getPublishedProductBySlug, listPublishedLines, listPublishedProducts } from '@/features/catalog/repository';
import type { CatalogLine, CatalogProduct } from '@/features/catalog/types';
import { getPublicSupabaseEnv } from '@/lib/env';
import type { HomeContent } from './types';

const fallbackLines: CatalogLine[] = [
  { id: 'bordados', slug: 'bordados-em-roupas', name: 'Bordados em roupas', description: 'Detalhes que levam significado às peças do dia a dia.', coverImage: '/images/catalogo/camisa-bordada.jpeg', sortOrder: 1 },
  { id: 'enxovais', slug: 'enxovais-e-toalhas', name: 'Enxovais e toalhas', description: 'Afeto bordado para chegadas, celebrações e rituais de casa.', coverImage: '/images/catalogo/toalhas-personalizadas.jpeg', sortOrder: 2 },
  { id: 'bolsas', slug: 'bolsas-de-croche', name: 'Bolsas de crochê', description: 'Texturas autorais feitas à mão para acompanhar novos caminhos.', coverImage: '/images/catalogo/bolsa-croche.jpeg', sortOrder: 3 },
  { id: 'presentes', slug: 'presentes-e-embalagens', name: 'Presentes e embalagens', description: 'Gestos delicados apresentados com o cuidado de uma lembrança.', coverImage: '/images/catalogo/presente-embalado.jpeg', sortOrder: 4 },
];

const fallbackProducts: CatalogProduct[] = [
  { id: 'camisa', lineSlug: 'bordados-em-roupas', slug: 'camisa-bordada', name: 'Camisa bordada', description: 'Uma inspiração para celebrar memórias em pequenos detalhes.', materials: [], availability: 'available', media: [{ url: '/images/catalogo/camisa-bordada.jpeg', altText: 'Camiseta branca com bordado personalizado da Damazio Atelier', caption: null, sortOrder: 1, isFeatured: true }], customizationFields: [] },
  { id: 'toalha', lineSlug: 'enxovais-e-toalhas', slug: 'toalha-personalizada', name: 'Toalha personalizada', description: 'Um gesto de cuidado pensado para acompanhar a rotina.', materials: [], availability: 'available', media: [{ url: '/images/catalogo/toalhas-personalizadas.jpeg', altText: 'Toalhas azuis personalizadas com bordado João Pedro', caption: null, sortOrder: 1, isFeatured: true }], customizationFields: [] },
  { id: 'bolsa', lineSlug: 'bolsas-de-croche', slug: 'bolsa-de-croche', name: 'Bolsa de crochê', description: 'Trama e acabamento para transformar o cotidiano.', materials: [], availability: 'limited', media: [{ url: '/images/catalogo/bolsa-croche.jpeg', altText: 'Bolsa bege de crochê artesanal da Damazio Atelier', caption: null, sortOrder: 1, isFeatured: true }], customizationFields: [] },
];

const e2eUnavailableProduct: CatalogProduct = {
  id: 'e2e-unavailable', lineSlug: 'bordados-em-roupas', slug: 'peca-indisponivel-e2e', name: 'Peça indisponível para teste',
  description: null, materials: [], availability: 'unavailable', media: [], customizationFields: [],
};

function editorialProducts(): CatalogProduct[] {
  return process.env.E2E_TEST_UNAVAILABLE_PRODUCT === 'true' ? [...fallbackProducts, e2eUnavailableProduct] : fallbackProducts;
}

function usesEditorialFallback(): boolean {
  try {
    getPublicSupabaseEnv();
    return false;
  } catch {
    return true;
  }
}

function editorialCatalog(): Pick<HomeContent, 'lines' | 'products'> {
  return { lines: fallbackLines, products: editorialProducts().filter((product) => product.availability !== 'unavailable') };
}

export async function getHomeContent(): Promise<HomeContent> {
  const catalog = await getCatalogContent();
  return { hero: { eyebrow: 'Damazio Atelier', title: 'Peças que contam histórias', description: 'Bordados, crochê e presentes autorais feitos sob encomenda para transformar afeto em memória.' }, lines: catalog.lines, products: catalog.products.slice(0, 3) };
}

export async function getCatalogContent(): Promise<Pick<HomeContent, 'lines' | 'products'>> {
  if (usesEditorialFallback()) {
    return editorialCatalog();
  }

  try {
    const [lines, products] = await Promise.all([listPublishedLines(), listPublishedProducts()]);
    return { lines, products };
  } catch {
    return editorialCatalog();
  }
}

export async function getCatalogProductBySlug(slug: string): Promise<CatalogProduct | null> {
  if (usesEditorialFallback()) {
    return editorialProducts().find((product) => product.slug === slug) ?? null;
  }

  try {
    return await getPublishedProductBySlug(slug);
  } catch {
    return editorialProducts().find((product) => product.slug === slug) ?? null;
  }
}
