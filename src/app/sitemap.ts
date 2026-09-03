import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/site';

const publicPaths = [
  '/',
  '/catalogo',
  '/catalogo/bordados-em-roupas',
  '/catalogo/enxovais-e-toalhas',
  '/catalogo/bolsas-de-croche',
  '/catalogo/presentes-e-embalagens',
  '/produtos/camisa-bordada',
  '/produtos/toalha-personalizada',
  '/produtos/bolsa-de-croche',
  '/solicitar-orcamento/camisa-bordada',
  '/solicitar-orcamento/toalha-personalizada',
  '/solicitar-orcamento/bolsa-de-croche',
  '/sobre',
  '/como-funciona',
  '/envio-nacional',
  '/perguntas-frequentes',
  '/contato',
  '/privacidade',
  '/termos',
];

export default function sitemap(): MetadataRoute.Sitemap {
  return publicPaths.map((path) => ({
    url: absoluteUrl(path),
    changeFrequency: 'monthly',
    priority: path === '/' ? 1 : path === '/catalogo' ? 0.9 : 0.7,
  }));
}

