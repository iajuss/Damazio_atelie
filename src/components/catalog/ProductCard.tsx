import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import type { CatalogProduct } from '@/features/catalog/types';

type ProductCardProps = { product: CatalogProduct };

export function ProductCard({ product }: ProductCardProps) {
  const featuredMedia = product.media.find((media) => media.isFeatured) ?? product.media[0];
  return <article className="product-card">
    {featuredMedia ? <div className="product-card__image-wrap"><Image className="product-card__image" src={featuredMedia.url} alt={featuredMedia.altText} fill sizes="(min-width: 48rem) 33vw, 100vw" unoptimized /></div> : <div className="product-card__visual" aria-hidden="true" />}
    <div className="product-card__body"><p className="product-card__line">{product.lineSlug.replaceAll('-', ' ')}</p><h3>{product.name}</h3>{product.description ? <p>{product.description}</p> : null}<div className="badges" aria-label="Características da peça"><span>Sob encomenda</span><span>Personalizável</span></div><Button href={`/produtos/${product.slug}`} variant="secondary">Solicitar orçamento</Button></div>
  </article>;
}
