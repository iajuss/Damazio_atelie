import { notFound } from 'next/navigation';
import { ProductDetails } from '@/components/catalog/ProductDetails';
import { ProductGallery } from '@/components/catalog/ProductGallery';
import { Container } from '@/components/ui/Container';
import { productMetadata } from '@/features/catalog/metadata';
import { getCatalogProductBySlug } from '@/features/content/repository';

type ProductPageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getCatalogProductBySlug(slug);
  return product ? productMetadata(product) : {};
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getCatalogProductBySlug(slug);
  if (!product) notFound();

  return <main id="conteudo"><Container className="product-page"><ProductGallery media={product.media} productName={product.name} /><ProductDetails product={product} /></Container></main>;
}
