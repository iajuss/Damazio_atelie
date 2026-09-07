import { notFound } from 'next/navigation';
import { RequestExperience } from '@/components/inquiries/RequestExperience';
import { ProductDetails } from '@/components/catalog/ProductDetails';
import { Container } from '@/components/ui/Container';
import { getCatalogProductBySlug } from '@/features/content/repository';
import { publicPageMetadata } from '@/lib/site';

type RequestPageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: RequestPageProps) {
  const { slug } = await params;
  const product = await getCatalogProductBySlug(slug);

  return product
    ? publicPageMetadata(`Solicitar ${product.name}`, `Conte à Damazio Atelier como imagina ${product.name}.`, `/solicitar-orcamento/${product.slug}`)
    : {};
}

export default async function RequestPage({ params }: RequestPageProps) {
  const { slug } = await params;
  const product = await getCatalogProductBySlug(slug);
  if (!product) notFound();
  if (product.availability === 'unavailable') return <main id="conteudo" tabIndex={-1}><Container className="request-page"><ProductDetails product={product} /></Container></main>;

  return <RequestExperience requestKind="product" product={product} />;
}
