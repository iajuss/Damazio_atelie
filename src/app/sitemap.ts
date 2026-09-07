import type { MetadataRoute } from 'next';
import { getCatalogContent } from '@/features/content/repository';
import { absoluteUrl } from '@/lib/site';

export const dynamic = 'force-dynamic';

const staticPublicPaths = [
  '/',
  '/catalogo',
  '/solicitar-orcamento',
  '/sobre',
  '/como-funciona',
  '/envio-nacional',
  '/perguntas-frequentes',
  '/contato',
  '/privacidade',
  '/termos',
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { lines, products } = await getCatalogContent();
  const publicPaths = [
    ...staticPublicPaths,
    ...lines.map((line) => `/catalogo/${line.slug}`),
    ...products.flatMap((product) => [`/produtos/${product.slug}`, `/solicitar-orcamento/${product.slug}`]),
  ];

  return [...new Set(publicPaths)].map((path) => ({
    url: absoluteUrl(path),
    changeFrequency: 'monthly',
    priority: path === '/' ? 1 : path === '/catalogo' ? 0.9 : 0.7,
  }));
}
