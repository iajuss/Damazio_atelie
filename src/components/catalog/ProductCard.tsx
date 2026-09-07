import Image from 'next/image';
import type { CatalogProduct } from '@/features/catalog/types';

type ProductCardProps = { product: CatalogProduct };

export function ProductCard({ product }: ProductCardProps) {
  const featuredMedia = product.media.find((media) => media.isFeatured) ?? product.media[0];
  const destination = `/produtos/${product.slug}`;

  return <article className="product-card">
    <a className="product-card__card-link" href={destination} aria-label={`Ver detalhes de ${product.name}`}>
      {featuredMedia ? <div className="product-card__image-wrap"><Image className="product-card__image" src={featuredMedia.url} alt={featuredMedia.altText} fill sizes="(min-width: 48rem) 33vw, 100vw" unoptimized /></div> : <div className="product-card__visual" aria-hidden="true" />}
      <div className="product-card__body"><p className="product-card__line">{product.lineSlug.replaceAll('-', ' ')}</p><h3>{product.name}</h3>{product.description ? <p>{product.description}</p> : null}<div className="badges" aria-label="Características da peça"><span>Sob encomenda</span><span>Personalizável</span></div><span className="button button--secondary">Ver detalhes de {product.name}</span></div>
    </a>
  </article>;
}
