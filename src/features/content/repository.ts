import { getPublishedProductBySlug, listPublishedLines, listPublishedProducts } from '@/features/catalog/repository';
import type { CatalogLine, CatalogProduct } from '@/features/catalog/types';
import { getPublicSupabaseEnv } from '@/lib/env';
import type { HomeContent } from './types';

const fallbackLines: CatalogLine[] = [
  { id: 'bordados', slug: 'bordados-em-roupas', name: 'Bordados em roupas', description: 'Detalhes que levam significado às peças do dia a dia.', coverImage: '/images/catalogo/camisa-bordada-sem-marca.jpeg', sortOrder: 1 },
  { id: 'enxovais', slug: 'enxovais-e-toalhas', name: 'Enxovais e toalhas', description: 'Afeto bordado para chegadas, celebrações e rituais de casa.', coverImage: '/images/catalogo/toalhas-personalizadas-sem-marca.jpeg', sortOrder: 2 },
  { id: 'bolsas', slug: 'bolsas-de-croche', name: 'Bolsas de crochê', description: 'Texturas autorais feitas à mão para acompanhar novos caminhos.', coverImage: '/images/catalogo/bolsa-croche-sem-marca.jpeg', sortOrder: 3 },
  { id: 'presentes', slug: 'presentes-e-embalagens', name: 'Presentes e embalagens', description: 'Gestos delicados apresentados com o cuidado de uma lembrança.', coverImage: '/images/catalogo/presente-embalado.jpeg', sortOrder: 4 },
  { id: 'sousplats', slug: 'sousplats-de-croche', name: 'Sousplats de crochê', description: 'Texturas feitas à mão para receber encontros à mesa.', coverImage: '/images/catalogo/sousplat-rosa-croche.jpeg', sortOrder: 5 },
];

const fallbackProducts: CatalogProduct[] = [
  { id: 'camisa', lineSlug: 'bordados-em-roupas', slug: 'camisa-bordada', name: 'Camisa bordada', description: 'Uma inspiração para celebrar memórias em pequenos detalhes.', materials: [], availability: 'available', media: [{ url: '/images/catalogo/camisa-bordada-sem-marca.jpeg', altText: 'Camiseta branca com bordado personalizado da Damazio Atelier', caption: null, sortOrder: 1, isFeatured: true }, { url: '/images/catalogo/camisa-familia.jpeg', altText: 'Camiseta branca bordada com ilustração de família', caption: 'Bordado que guarda uma celebração em família', sortOrder: 2, isFeatured: false }, { url: '/images/catalogo/camisa-embalada.jpeg', altText: 'Camiseta bordada embalada para presente', caption: 'Peça preparada para ser entregue com afeto', sortOrder: 3, isFeatured: false }], customizationFields: [] },
  { id: 'toalha', lineSlug: 'enxovais-e-toalhas', slug: 'toalha-personalizada', name: 'Toalha personalizada', description: 'Um gesto de cuidado pensado para acompanhar a rotina.', materials: [], availability: 'available', media: [{ url: '/images/catalogo/toalhas-personalizadas-sem-marca.jpeg', altText: 'Toalhas azuis personalizadas com bordado João Pedro', caption: null, sortOrder: 1, isFeatured: true }, { url: '/images/catalogo/toalha-ronaldo.jpeg', altText: 'Toalha branca bordada com o nome Ronaldo', caption: 'Bordado com inicial e nome', sortOrder: 2, isFeatured: false }, { url: '/images/catalogo/toalha-tamires.jpeg', altText: 'Toalha branca bordada com o nome Tamires', caption: 'Personalização em tons neutros', sortOrder: 3, isFeatured: false }, { url: '/images/catalogo/toalha-heitor.jpeg', altText: 'Toalha branca bordada com o nome Heitor', caption: 'Inicial e nome bordados', sortOrder: 4, isFeatured: false }, { url: '/images/catalogo/toalha-marina.jpeg', altText: 'Toalha bordada com o nome Marina', caption: 'Bordado em azul e branco', sortOrder: 5, isFeatured: false }, { url: '/images/catalogo/toalha-milena.jpeg', altText: 'Toalha bordada com o nome Milena', caption: 'Bordado em tons suaves', sortOrder: 6, isFeatured: false }, { url: '/images/catalogo/kit-toalhas-embalado.jpeg', altText: 'Kit de toalhas bordadas embalado pela Damazio Atelier', caption: 'Uma sugestão para presentear', sortOrder: 7, isFeatured: false }], customizationFields: [] },
  { id: 'bolsa', lineSlug: 'bolsas-de-croche', slug: 'bolsa-de-croche', name: 'Bolsa de crochê', description: 'Trama e acabamento para transformar o cotidiano.', materials: [], availability: 'limited', media: [{ url: '/images/catalogo/bolsa-croche-sem-marca.jpeg', altText: 'Bolsa bege de crochê artesanal da Damazio Atelier', caption: null, sortOrder: 1, isFeatured: true }, { url: '/images/catalogo/bolsa-dourada-croche.jpeg', altText: 'Bolsa marrom de crochê com ferragens douradas', caption: 'Trama e ferragens em evidência', sortOrder: 2, isFeatured: false }], customizationFields: [] },
  { id: 'presente', lineSlug: 'presentes-e-embalagens', slug: 'presente-embalado', name: 'Presente embalado', description: 'Uma lembrança preparada para surpreender desde o primeiro detalhe.', materials: [], availability: 'available', media: [{ url: '/images/catalogo/presente-embalado.jpeg', altText: 'Presente embalado pela Damazio Atelier', caption: 'Embalagem preparada para tornar a entrega ainda mais especial', sortOrder: 1, isFeatured: true }], customizationFields: [] },
  { id: 'sousplat', lineSlug: 'sousplats-de-croche', slug: 'sousplat-de-croche', name: 'Sousplats de crochê', description: 'Tramas autorais para acolher encontros à mesa.', materials: [], availability: 'available', media: [{ url: '/images/catalogo/mesa-sousplats-croche.jpeg', altText: 'Mesa posta com sousplats de crochê', caption: 'Um detalhe que acolhe encontros', sortOrder: 1, isFeatured: true }, { url: '/images/catalogo/sousplat-branco-dourado.jpeg', altText: 'Sousplat branco de crochê com acabamento dourado', caption: 'Textura para a mesa posta', sortOrder: 2, isFeatured: false }, { url: '/images/catalogo/sousplat-rosa-croche.jpeg', altText: 'Sousplat rosé de crochê com borda clara', caption: 'Crochê em composição delicada', sortOrder: 3, isFeatured: false }], customizationFields: [] },
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
