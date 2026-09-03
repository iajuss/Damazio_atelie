import { LineCard } from '@/components/catalog/LineCard';
import { ProductCard } from '@/components/catalog/ProductCard';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { catalogMetadata } from '@/features/catalog/metadata';
import { getCatalogContent } from '@/features/content/repository';

export const metadata = catalogMetadata();

export default async function CatalogPage() {
  const { lines, products } = await getCatalogContent();

  return <main id="conteudo"><section className="catalog-hero"><Container><p className="eyebrow">Catálogo consultivo</p><h1>Criações para inspirar a sua história</h1><p>Escolha uma linha, descubra possibilidades e conte à Damazio o que deseja criar.</p></Container></section><section className="content-section" aria-labelledby="linhas-catalogo"><Container><SectionHeading id="linhas-catalogo">Linhas do atelier</SectionHeading><div className="line-grid">{lines.map((line) => <LineCard key={line.id} line={line} />)}</div></Container></section><section className="content-section" aria-labelledby="produtos-catalogo"><Container><SectionHeading id="produtos-catalogo">Inspirações sob encomenda</SectionHeading><div className="product-grid">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div></Container></section></main>;
}
