import { notFound } from 'next/navigation';
import { ProductCard } from '@/components/catalog/ProductCard';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { lineMetadata } from '@/features/catalog/metadata';
import { getCatalogContent } from '@/features/content/repository';

type LinePageProps = { params: Promise<{ lineSlug: string }> };

export async function generateMetadata({ params }: LinePageProps) {
  const { lineSlug } = await params;
  const { lines } = await getCatalogContent();
  const line = lines.find((item) => item.slug === lineSlug);
  return line ? lineMetadata(line) : {};
}

export default async function CatalogLinePage({ params }: LinePageProps) {
  const { lineSlug } = await params;
  const { lines, products } = await getCatalogContent();
  const line = lines.find((item) => item.slug === lineSlug);
  if (!line) notFound();

  const lineProducts = products.filter((product) => product.lineSlug === line.slug);
  return <main id="conteudo" tabIndex={-1}><section className="catalog-hero"><Container><p className="eyebrow">Linha do atelier</p><h1>{line.name}</h1>{line.description ? <p>{line.description}</p> : null}</Container></section><section className="content-section" aria-labelledby="pecas-da-linha"><Container><SectionHeading id="pecas-da-linha">Peças para inspirar</SectionHeading>{lineProducts.length > 0 ? <div className="product-grid">{lineProducts.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <p className="catalog-empty">Novas inspirações desta linha estarão disponíveis em breve. Enquanto isso, conte sua ideia pelo Direct.</p>}</Container></section></main>;
}
